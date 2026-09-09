/* =============================================================================
   GIOIA — Moteur de réservation
   Parcours en 3 étapes : date & service → coordonnées → confirmation.
   Fonctionne sans backend (démonstration + mémorisation locale) et sait
   transmettre la demande à une API si `window.GIOIA_BOOKING_ENDPOINT` est défini
   (voir site/server/reservations.mjs pour un exemple d'implémentation).
   ========================================================================== */

(function () {
  'use strict';

  var form = document.getElementById('booking-form');
  if (!form) { return; }

  /* ====================== Paramètres du restaurant ======================= */

  var CONFIG = {
    // 0 = dimanche … 6 = samedi
    services: {
      0: [{ id: 'dejeuner', label: 'Déjeuner', from: '12:00', to: '14:00' }],
      1: [],
      2: [{ id: 'dejeuner', label: 'Déjeuner', from: '12:00', to: '14:00' },
          { id: 'diner', label: 'Dîner', from: '19:00', to: '22:00' }],
      3: [{ id: 'dejeuner', label: 'Déjeuner', from: '12:00', to: '14:00' },
          { id: 'diner', label: 'Dîner', from: '19:00', to: '22:00' }],
      4: [{ id: 'dejeuner', label: 'Déjeuner', from: '12:00', to: '14:00' },
          { id: 'diner', label: 'Dîner', from: '19:00', to: '22:00' }],
      5: [{ id: 'dejeuner', label: 'Déjeuner', from: '12:00', to: '14:00' },
          { id: 'diner', label: 'Dîner', from: '19:00', to: '22:30' }],
      6: [{ id: 'dejeuner', label: 'Déjeuner', from: '12:00', to: '14:00' },
          { id: 'diner', label: 'Dîner', from: '19:00', to: '22:30' }]
    },
    stepMinutes: 15,
    maxPartyOnline: 8,
    leadTimeMinutes: 120,   // délai minimum avant le service
    horizonDays: 120,       // réservation possible jusqu'à 4 mois
    seatsPerSlot: 14,       // capacité indicative par créneau
    storageKey: 'gioia:reservations',
    phone: '+33199001234',
    phoneDisplay: '+33 1 99 00 12 34'
  };

  var DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                     'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  /* ============================ État courant ============================= */

  var state = {
    step: 1,
    party: 2,
    date: '',
    service: '',
    time: '',
    area: 'indifferent',
    occasion: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    newsletter: false,
    consent: false,
    reference: ''
  };

  /* ======================== Sélecteurs du document ======================= */

  var steps = Array.prototype.slice.call(form.querySelectorAll('.step'));
  var stepperItems = Array.prototype.slice.call(document.querySelectorAll('.stepper__item'));
  var partyRow = document.getElementById('party-row');
  var dateInput = document.getElementById('booking-date');
  var slotsHost = document.getElementById('slots-host');
  var dateNote = document.getElementById('date-note');
  var summaryHost = document.getElementById('summary-host');
  var confirmationHost = document.getElementById('confirmation-host');
  var savedHost = document.getElementById('saved-host');
  var formError = document.getElementById('form-error');
  var largePartyNote = document.getElementById('large-party-note');

  /* =============================== Dates ================================= */

  function pad(n) { return String(n).padStart(2, '0'); }

  function toISODate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseISODate(iso) {
    var parts = String(iso).split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function formatLongDate(iso) {
    if (!iso) { return '—'; }
    var d = parseISODate(iso);
    return DAY_NAMES[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
  }

  function minutesFromTime(time) {
    var p = time.split(':');
    return Number(p[0]) * 60 + Number(p[1]);
  }

  function timeFromMinutes(mins) {
    return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60);
  }

  /* ============ Disponibilités (simulation déterministe) ================= */
  /* Sans backend, on simule un taux de remplissage stable pour une même date
     afin que le parcours reste crédible et reproductible.                    */

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0);
  }

  function seatsLeft(iso, time) {
    var h = hash(iso + '|' + time);
    var taken = h % (CONFIG.seatsPerSlot + 3); // parfois > capacité → complet
    return Math.max(0, CONFIG.seatsPerSlot - taken);
  }

  function buildSlots(iso, service) {
    var out = [];
    var start = minutesFromTime(service.from);
    var end = minutesFromTime(service.to);
    var now = new Date();
    var isToday = iso === toISODate(now);
    var nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (var m = start; m <= end; m += CONFIG.stepMinutes) {
      var time = timeFromMinutes(m);
      var left = seatsLeft(iso, time);
      var tooLate = isToday && m < nowMinutes + CONFIG.leadTimeMinutes;
      out.push({
        time: time,
        seatsLeft: left,
        available: !tooLate && left >= state.party,
        reason: tooLate ? 'past' : (left < state.party ? 'full' : '')
      });
    }
    return out;
  }

  /* ========================= Rendu des créneaux ========================== */

  function renderSlots() {
    if (!slotsHost) { return; }
    slotsHost.innerHTML = '';

    if (!state.date) {
      slotsHost.innerHTML = '<p class="slots__empty">Choisissez une date pour afficher les créneaux disponibles.</p>';
      return;
    }

    var day = parseISODate(state.date).getDay();
    var services = CONFIG.services[day] || [];

    if (!services.length) {
      slotsHost.innerHTML = '<p class="slots__empty">Le restaurant est fermé le ' + DAY_NAMES[day] +
        '. Nous vous accueillons du mardi au dimanche.</p>';
      return;
    }

    var anyAvailable = false;

    services.forEach(function (service) {
      var slots = buildSlots(state.date, service);
      if (slots.some(function (s) { return s.available; })) { anyAvailable = true; }

      var group = document.createElement('div');
      group.className = 'slots__group';

      var title = document.createElement('p');
      title.className = 'slots__title';
      title.textContent = service.label + ' · ' + service.from + ' – ' + service.to;
      group.appendChild(title);

      var grid = document.createElement('div');
      grid.className = 'slots';
      grid.setAttribute('role', 'group');
      grid.setAttribute('aria-label', 'Créneaux du service ' + service.label);

      slots.forEach(function (slot) {
        var id = 'slot-' + service.id + '-' + slot.time.replace(':', '');
        var wrap = document.createElement('label');
        wrap.className = 'choice';

        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'time';
        input.id = id;
        input.value = slot.time;
        input.disabled = !slot.available;
        input.checked = state.time === slot.time && state.service === service.id;
        input.setAttribute('data-service', service.id);
        if (!slot.available) {
          input.setAttribute('aria-label', slot.time + ' — ' +
            (slot.reason === 'past' ? 'trop tardif pour aujourd’hui' : 'complet'));
        } else {
          input.setAttribute('aria-label', slot.time + ' — ' + slot.seatsLeft + ' couverts disponibles');
        }

        var span = document.createElement('span');
        span.textContent = slot.time;

        input.addEventListener('change', function () {
          state.time = slot.time;
          state.service = service.id;
          clearError('time');
          renderSummary();
        });

        wrap.appendChild(input);
        wrap.appendChild(span);
        grid.appendChild(wrap);
      });

      group.appendChild(grid);
      slotsHost.appendChild(group);
    });

    if (!anyAvailable) {
      var note = document.createElement('p');
      note.className = 'slots__empty';
      note.innerHTML = 'Plus aucun créneau pour ' + state.party + ' couverts à cette date. ' +
        'Essayez une autre journée ou appelez-nous au <a class="link-line" href="tel:' +
        CONFIG.phone + '">' + CONFIG.phoneDisplay + '</a>.';
      slotsHost.appendChild(note);
    }
  }

  /* ========================== Récapitulatif ============================== */

  function areaLabel(value) {
    return {
      indifferent: 'Sans préférence',
      salle: 'La Salle',
      cave: 'La Cave voûtée',
      bar: 'Il Bar'
    }[value] || 'Sans préférence';
  }

  function serviceLabel(id) {
    return id === 'dejeuner' ? 'Déjeuner' : (id === 'diner' ? 'Dîner' : '—');
  }

  function renderSummary() {
    if (!summaryHost) { return; }
    var rows = [
      ['Couverts', state.party + (state.party > 1 ? ' personnes' : ' personne')],
      ['Date', formatLongDate(state.date)],
      ['Service', state.time ? serviceLabel(state.service) + ' · ' + state.time : '—'],
      ['Salle', areaLabel(state.area)]
    ];

    if (state.firstName || state.lastName) {
      rows.push(['Au nom de', (state.firstName + ' ' + state.lastName).trim()]);
    }
    if (state.occasion) {
      rows.push(['Occasion', state.occasion]);
    }

    summaryHost.innerHTML = rows.map(function (row) {
      return '<div class="summary__row"><dt>' + row[0] + '</dt><dd>' + escapeHTML(row[1]) + '</dd></div>';
    }).join('');
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ============================= Étapes ================================= */

  function goToStep(n) {
    state.step = n;
    steps.forEach(function (step) {
      step.classList.toggle('is-active', Number(step.getAttribute('data-step')) === n);
    });
    stepperItems.forEach(function (item, i) {
      item.classList.toggle('is-active', i + 1 === n);
      item.classList.toggle('is-done', i + 1 < n);
    });
    if (formError) { formError.hidden = true; }

    var panel = document.querySelector('.booking__panel');
    if (panel) {
      var top = panel.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  /* ============================ Validation ============================== */

  function setError(name, message) {
    var field = form.querySelector('[data-field="' + name + '"]');
    if (!field) { return; }
    field.classList.add('has-error');
    var slot = field.querySelector('.field__error');
    if (slot) { slot.textContent = message; }
  }

  function clearError(name) {
    var field = form.querySelector('[data-field="' + name + '"]');
    if (!field) { return; }
    field.classList.remove('has-error');
    var slot = field.querySelector('.field__error');
    if (slot) { slot.textContent = ''; }
  }

  function showFormError(message) {
    if (!formError) { return; }
    formError.textContent = message;
    formError.hidden = false;
  }

  function validateStep1() {
    var ok = true;

    if (!state.date) {
      setError('date', 'Merci de choisir une date.');
      ok = false;
    } else {
      var d = parseISODate(state.date);
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var max = new Date(today.getTime()); max.setDate(max.getDate() + CONFIG.horizonDays);
      if (d < today) { setError('date', 'Cette date est déjà passée.'); ok = false; }
      else if (d > max) { setError('date', 'Réservations ouvertes jusqu’à ' + CONFIG.horizonDays + ' jours.'); ok = false; }
      else if (!(CONFIG.services[d.getDay()] || []).length) {
        setError('date', 'Nous sommes fermés le ' + DAY_NAMES[d.getDay()] + '.');
        ok = false;
      } else { clearError('date'); }
    }

    if (!state.time) {
      setError('time', 'Merci de sélectionner un horaire.');
      ok = false;
    } else { clearError('time'); }

    if (!ok) { showFormError('Quelques informations manquent pour continuer.'); }
    return ok;
  }

  function validateStep2() {
    var ok = true;

    if (state.firstName.trim().length < 2) { setError('firstName', 'Indiquez votre prénom.'); ok = false; }
    else { clearError('firstName'); }

    if (state.lastName.trim().length < 2) { setError('lastName', 'Indiquez votre nom.'); ok = false; }
    else { clearError('lastName'); }

    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(state.email.trim())) {
      setError('email', 'Adresse e-mail invalide.'); ok = false;
    } else { clearError('email'); }

    var digits = state.phone.replace(/[^0-9+]/g, '');
    if (digits.replace(/\D/g, '').length < 9) {
      setError('phone', 'Numéro de téléphone invalide.'); ok = false;
    } else { clearError('phone'); }

    if (!state.consent) { setError('consent', 'Merci d’accepter le traitement de vos données.'); ok = false; }
    else { clearError('consent'); }

    if (!ok) { showFormError('Merci de corriger les champs signalés.'); }
    return ok;
  }

  /* ====================== Enregistrement & envoi ========================= */

  function makeReference() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    for (var i = 0; i < 6; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'GIO-' + out;
  }

  function payload() {
    return {
      reference: state.reference,
      party: state.party,
      date: state.date,
      service: state.service,
      time: state.time,
      area: state.area,
      occasion: state.occasion,
      firstName: state.firstName.trim(),
      lastName: state.lastName.trim(),
      email: state.email.trim(),
      phone: state.phone.trim(),
      notes: state.notes.trim(),
      newsletter: state.newsletter,
      createdAt: new Date().toISOString()
    };
  }

  function saveLocally(data) {
    try {
      var list = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
      list.unshift(data);
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(list.slice(0, 12)));
    } catch (e) { /* stockage indisponible : sans conséquence */ }
  }

  function readLocal() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
    } catch (e) { return []; }
  }

  function submitBooking() {
    var data = payload();
    var endpoint = window.GIOIA_BOOKING_ENDPOINT;

    if (!endpoint) {
      saveLocally(data);
      return Promise.resolve(data);
    }

    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.json();
    }).then(function (res) {
      var merged = Object.assign({}, data, res || {});
      saveLocally(merged);
      return merged;
    });
  }

  /* ===================== Fichier calendrier (.ics) ======================= */

  function buildICS(data) {
    var start = parseISODate(data.date);
    var t = data.time.split(':');
    start.setHours(Number(t[0]), Number(t[1]), 0, 0);
    var end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    function stamp(d) {
      return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
             pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
    }

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GIOIA//Reservation//FR',
      'BEGIN:VEVENT',
      'UID:' + data.reference + '@gioia-paris.fr',
      'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(start),
      'DTEND:' + stamp(end),
      'SUMMARY:Dîner chez GIOIA — ' + data.party + ' couverts',
      'DESCRIPTION:Référence ' + data.reference + '. Pour toute modification : ' + CONFIG.phoneDisplay,
      'LOCATION:GIOIA\\, 12 rue Dauphine\\, 75006 Paris',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function downloadICS(data) {
    var blob = new Blob([buildICS(data)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'gioia-' + data.reference + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ========================== Confirmation ============================== */

  function renderConfirmation(data) {
    if (!confirmationHost) { return; }

    confirmationHost.innerHTML =
      '<div class="confirmation">' +
        '<div class="confirmation__seal" aria-hidden="true">' +
          '<svg width="30" height="24" viewBox="0 0 30 24"><path d="M2 12.5L10.5 21 28 3" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' +
        '</div>' +
        '<p class="eyebrow eyebrow--center">Demande enregistrée</p>' +
        '<h2>Grazie, ' + escapeHTML(data.firstName) + '.</h2>' +
        '<p class="lead" style="margin-inline:auto;margin-top:1rem;">Votre table est notée. Vous recevrez une confirmation ' +
          'par e-mail à <strong>' + escapeHTML(data.email) + '</strong> sous quelques minutes.</p>' +
        '<p class="confirmation__ref">Référence ' + escapeHTML(data.reference) + '</p>' +
        '<dl class="summary confirmation__recap">' +
          '<div class="summary__row"><dt>Date</dt><dd>' + formatLongDate(data.date) + '</dd></div>' +
          '<div class="summary__row"><dt>Heure</dt><dd>' + escapeHTML(data.time) + ' · ' + serviceLabel(data.service) + '</dd></div>' +
          '<div class="summary__row"><dt>Couverts</dt><dd>' + data.party + '</dd></div>' +
          '<div class="summary__row"><dt>Salle</dt><dd>' + areaLabel(data.area) + '</dd></div>' +
        '</dl>' +
        '<div class="btn-group" style="justify-content:center;margin-top:2.5rem;">' +
          '<button type="button" class="btn btn--gold" id="ics-btn">Ajouter à mon agenda</button>' +
          '<a class="btn btn--ghost" href="index.html">Retour à l’accueil</a>' +
        '</div>' +
        '<p class="summary__note" style="margin-top:2rem;">Un imprévu ? Prévenez-nous au moins 4 heures à l’avance ' +
          'au <a class="link-line" href="tel:' + CONFIG.phone + '">' + CONFIG.phoneDisplay + '</a>.</p>' +
      '</div>';

    var icsBtn = document.getElementById('ics-btn');
    if (icsBtn) {
      icsBtn.addEventListener('click', function () { downloadICS(data); });
    }
  }

  function renderSaved() {
    if (!savedHost) { return; }
    var list = readLocal();
    if (!list.length) {
      savedHost.innerHTML = '<p class="summary__note">Aucune réservation enregistrée sur cet appareil.</p>';
      return;
    }
    savedHost.innerHTML = '<ul class="saved-list">' + list.map(function (r) {
      return '<li class="saved-item">' +
        '<span class="saved-item__ref">' + escapeHTML(r.reference) + '</span>' +
        '<span class="saved-item__meta">' + formatLongDate(r.date) + ' · ' + escapeHTML(r.time) +
        ' · ' + r.party + ' couverts</span>' +
      '</li>';
    }).join('') + '</ul>';
  }

  /* ============================= Écouteurs ============================== */

  function bindParty() {
    if (!partyRow) { return; }
    partyRow.addEventListener('change', function (e) {
      if (e.target.name !== 'party') { return; }
      var value = e.target.value;
      if (value === 'plus') {
        if (largePartyNote) { largePartyNote.hidden = false; }
        return;
      }
      if (largePartyNote) { largePartyNote.hidden = true; }
      state.party = Number(value);
      state.time = '';
      state.service = '';
      renderSlots();
      renderSummary();
    });
  }

  function bindDate() {
    if (!dateInput) { return; }

    var today = new Date();
    var max = new Date(today.getTime());
    max.setDate(max.getDate() + CONFIG.horizonDays);
    dateInput.min = toISODate(today);
    dateInput.max = toISODate(max);

    dateInput.addEventListener('change', function () {
      state.date = dateInput.value;
      state.time = '';
      state.service = '';
      clearError('date');
      if (dateNote) {
        var day = state.date ? parseISODate(state.date).getDay() : -1;
        if (day === 1) {
          dateNote.textContent = 'Le restaurant est fermé le lundi.';
        } else if (day === 0) {
          dateNote.textContent = 'Le dimanche, nous servons uniquement le déjeuner.';
        } else {
          dateNote.textContent = '';
        }
      }
      renderSlots();
      renderSummary();
    });
  }

  function bindTextFields() {
    var map = {
      firstName: 'booking-firstname',
      lastName: 'booking-lastname',
      email: 'booking-email',
      phone: 'booking-phone',
      notes: 'booking-notes',
      occasion: 'booking-occasion'
    };

    Object.keys(map).forEach(function (key) {
      var el = document.getElementById(map[key]);
      if (!el) { return; }
      el.addEventListener('input', function () {
        state[key] = el.value;
        clearError(key);
        renderSummary();
      });
      el.addEventListener('change', function () {
        state[key] = el.value;
        renderSummary();
      });
    });

    var area = document.getElementById('area-row');
    if (area) {
      area.addEventListener('change', function (e) {
        if (e.target.name !== 'area') { return; }
        state.area = e.target.value;
        renderSummary();
      });
    }

    var consent = document.getElementById('booking-consent');
    if (consent) {
      consent.addEventListener('change', function () {
        state.consent = consent.checked;
        clearError('consent');
      });
    }

    var news = document.getElementById('booking-newsletter');
    if (news) {
      news.addEventListener('change', function () { state.newsletter = news.checked; });
    }
  }

  function bindNavigation() {
    form.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = Number(btn.getAttribute('data-goto'));
        if (target > state.step) {
          if (state.step === 1 && !validateStep1()) { return; }
          if (state.step === 2 && !validateStep2()) { return; }
        }
        goToStep(target);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep2()) { return; }

      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.textContent = 'Envoi en cours…';
      }

      state.reference = makeReference();

      submitBooking().then(function (data) {
        goToStep(3);
        renderConfirmation(data);
        renderSaved();
      }).catch(function () {
        showFormError('L’envoi a échoué. Merci de réessayer ou de nous appeler au ' + CONFIG.phoneDisplay + '.');
      }).then(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.label || 'Confirmer la réservation';
        }
      });
    });
  }

  /* ============================= Démarrage ============================== */

  function preselectFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var date = params.get('date');
    var party = params.get('party');

    if (party && dateInput) {
      var radio = form.querySelector('input[name="party"][value="' + party + '"]');
      if (radio) { radio.checked = true; state.party = Number(party); }
    }
    if (date && dateInput) {
      dateInput.value = date;
      state.date = date;
    }
  }

  bindParty();
  bindDate();
  bindTextFields();
  bindNavigation();
  preselectFromQuery();
  renderSlots();
  renderSummary();
  renderSaved();
})();
