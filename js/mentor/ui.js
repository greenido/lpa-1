/**
 * JS for the mentor web app
 * Author: Ido Green, Ewa Gasperowicz
 * Date: 10/2016
 * V0.9
 * A 🐱 App
 *
 * TODO: Add Analytics support.
 * TODO: Add Transition animations.
 * TODO: Use ES6 modules.
 */
var UI = (function(firebaseApi, authModule, router) {

  const BASE_URL = '/index-mentor-new.html';

  const YOUTUBE_REGEX = /www\.youtube\.com\/watch\?v\=(\w+)\&*.*/;
  const VIMEO_REGEX = /www\.vimeo\.com\/(\w+)\&*.*/;

  /**
   * UI Elements cache.
   */
  const ELEMENTS = {
    main: document.getElementById('lpa-main'),
    mentorsListTemplate: document.getElementById('lpa-mentors-list-template'),
    mentorsList: document.getElementById('lpa-mentors-list'),
    attendeesListTemplate: document.getElementById('lpa-attendees-list-template'),
    attendeesList: document.getElementById('lpa-attendees-list'),
    startupsListTemplate: document.getElementById('lpa-startups-list-template'),
    startupsList: document.getElementById('lpa-startups-list'),
    mainNav: document.getElementById('lpa-main-nav'),
    userNav: document.getElementById('lpa-user-nav'),
    mdlLayout: document.querySelector('.mdl-layout'),
    drawer: document.getElementById('lpa-drawer'),
    drawerNav: document.getElementById('lpa-drawer-nav'),
    message: document.getElementById('lpa-message'),
    datepicker: document.getElementById('schedule-datepicker'),
    scheduleList: document.getElementById('lpa-schedule-list'),
    scheduleListTemplate: document.getElementById('lpa-schedule-list-template'),
    startupPageContent: document.getElementById('lpa-startup'),
    startupPageTemplate: document.getElementById('lpa-startup-template'),
    surveyBtn: document.getElementById('lpa-survey-btn'),
    surveyBtns: document.querySelectorAll('.lpa-survey-btn'),
    survey: document.getElementById('lpa-survey'),
    surveySubmit: document.getElementById('lpa-survey-submit'),
    surveyNotesField: document.getElementById('lpa-survey-notes'),
    surveyActionItemsField: document.getElementById('lpa-survey-actionitems'),
    startupShowNotes: document.getElementById('lpa-startup-show-notes'),
    startupNotesTemplate: document.getElementById('lpa-startup-notes-template'),
    startupNotes: document.getElementById('lpa-startup-notes'),
    chooseStartupBtn: document.getElementById('lpa-choose-startup-btn'),
    chooseStartupMenu: document.getElementById('lpa-choose-startup-menu'),
    chooseStartup: document.getElementById('lpa-choose-startup'),
    profileForm: document.getElementById('lpa-profile-form'),
    profileSubmit: document.getElementById('lpa-profile-submit'),
    camera: document.getElementById('lpa-camera'),
    cameraPreview: document.getElementById('lpa-camera-preview')
  };

  function getParentNodeByType(el, nodeType) {
    while (el && el.tagName !== nodeType) {
       el = el.parentNode;
    }
    return el;
  };

  function navigate(e, opt_elType) {
    e.preventDefault();
    let elType = opt_elType || 'A';
    let linkEl = getParentNodeByType(e.target, elType);
    let subpageName = linkEl.getAttribute('data-subpage');
    if (subpageName) {
      let url = BASE_URL + '/' + subpageName;
      let itemKey = linkEl.getAttribute('data-key');
      if (itemKey) {
        url = url + '/' + itemKey;
      }
      window.history.pushState(null, null, url);
      UI.showSubpage(subpageName, itemKey);
    }
  };

  function populateText(node, fields, obj) {
    for (var i = 0; i < fields.length; i++) {
      let selector = '[data-field="' + fields[i].toLowerCase() + '"]';
      node.querySelector(selector).innerText = obj[fields[i]];

    }
  };

  function populateLinks(node, fields) {
    for (var i = 0; i < fields.length; i++) {
      if (fields[i][1]) {
        let selector = '[data-field="' + fields[i][0].toLowerCase() + '"]';
        node.querySelector(selector).href = fields[i][1];
      }
    }
  };

  function fillStartupTemplate(template, startup) {
    let node = template.cloneNode(true);
    node.removeAttribute('id');
    node.classList.remove('lpa-template');
    node.setAttribute('data-key', startup.key);
    node.querySelector('[data-field="name"]').innerText = startup.name;
    node.querySelector('[data-field="description"]').innerText = startup.description;
    node.querySelector('[data-field="country"]').innerText = startup.country;
    node.querySelector('[data-field="city"]').innerText = startup.city;
    node.querySelector('[data-field="founded"]').innerText = startup.dateFounded;
    node.querySelector('[data-field="size"]').innerText = startup.numEmployees + ' employees';
    node.querySelector('[data-field="logo"]').src = startup.logo;
    return node;
  }

  /**
   * Component responsible for HTML modification.
   */
  let UI = {
    ELEMENTS: ELEMENTS,
    updateUser: function(user) {
      document.body.classList.toggle('lpa-signed-in', !!user);
      if (user) {
        UI.showSubpage('schedule');
      } else {
        UI.showSubpage('signin');
        ELEMENTS.mentorsList.innerHTML = '';
      }
      if (ELEMENTS.drawer.classList.contains('is-visible')) {
        ELEMENTS.mdlLayout.MaterialLayout.toggleDrawer();
      }
    },
    updateMentor: () => {
      let fields = ELEMENTS.profileForm;
      let mentor = firebaseApi.CURRENT_MENTOR || {};
      fields['lpa-profile-name'].value = mentor.name || '';
      fields['lpa-profile-email'].value = mentor.email || '';
      fields['lpa-profile-phone'].value = mentor.phone || '';
      fields['lpa-profile-country'].value = mentor.country || '';
      fields['lpa-profile-city'].value = mentor.city || '';
      fields['lpa-profile-twitter'].value = mentor.twitter || '';
      fields['lpa-profile-bio'].innerHTML = mentor.bio || '';
      fields['lpa-profile-funfact'].innerHTML = mentor.funFact || '';
      fields['lpa-profile-expertise'].innerHTML = mentor.expertise || '';
      fields['lpa-profile-linkedin'].value = mentor.linkedin || '';
      fields['lpa-profile-site'].value = mentor.site || '';
      fields['lpa-profile-pictureurl'].value = mentor.pic || '';
      fields['lpa-profile-comments'].value = mentor.comments || '';
    },
    updateMentorsList: function(mentorSnapshots) {
      ELEMENTS.mentorsList.innerHTML = '';
      if (mentorSnapshots) {
        mentorSnapshots.forEach(function(mentorSnapshot) {
          let node = ELEMENTS.mentorsListTemplate.cloneNode(true);
          node.removeAttribute('id');
          node.classList.remove('lpa-template');
          populateText(node, ['name', 'city', 'country', 'domain', 'domainsec',
            'expertise'], mentorSnapshot);
          populateLinks(node, [
            ['site', mentorSnapshot.site],
            ['email', 'mailoto:' + mentorSnapshot.email],
            ['twitter', 'https://twitter.com/' + mentorSnapshot.twitter],
            ['linkedin', 'https://pl.linkedin.com/in/' + mentorSnapshot.linkedin]
          ]);
          ELEMENTS.mentorsList.appendChild(node);
          if (mentorSnapshot.pic) {
            if (mentorSnapshot.pic.indexOf('http') != 0) {
              mentorSnapshot.pic = 'http://' + mentorSnapshot.pic;
            }
            let pic = node.querySelector('[data-field="pic"]');
            pic.innerText = ' ';
            pic.setAttribute('style', 'background: url("'+ mentorSnapshot.pic + '") center/cover;');
          }
        });
      }
    },
    updateAttendeesList: function(attendeeSnapshots) {
      ELEMENTS.attendeesList.innerHTML = '';
      if (attendeeSnapshots) {
        attendeeSnapshots.forEach(function(attendeeSnapshot) {
          let node = ELEMENTS.attendeesListTemplate.cloneNode(true);
          node.removeAttribute('id');
          node.classList.remove('lpa-template');
          node.querySelector('[data-field="name"]').innerText = attendeeSnapshot.name;
          node.querySelector('[data-field="role"]').innerText = attendeeSnapshot.role;
          node.querySelector('[data-field="startup"]').innerText = attendeeSnapshot.startup;
          node.querySelector('[data-field="funfact"]').innerText = attendeeSnapshot.funfact || '';
          //node.querySelector('[data-field="pic"]').innerText = attendeeSnapshot.funfact;
          node.querySelector('[data-field="email"]').setAttribute(
              'href', 'mailto:' + attendeeSnapshot.email);
          node.querySelector('[data-field="linkedin"]').setAttribute(
              'href', 'https://pl.linkedin.com/in/' + attendeeSnapshot.linkedin);
          if (attendeeSnapshot.pic) {
            let pic = node.querySelector('[data-field="pic"]');
            pic.innerHTML = '';
            pic.style = 'background: url("'+ attendeeSnapshot.pic + '") center/cover;';
          }
          ELEMENTS.attendeesList.appendChild(node);
        });
      }
    },
    updateStartupsList: function(startups) {
      // Update /startups page.
      ELEMENTS.startupsList.innerHTML = '';
      // Update startups dropdown in the survey.
      ELEMENTS.chooseStartupMenu.innerHTML = '';
      if (startups) {
        startups.forEach(function(startup) {
          let node = fillStartupTemplate(ELEMENTS.startupsListTemplate, startup);
          node.setAttribute('data-subpage', 'startup');
          ELEMENTS.startupsList.appendChild(node);
          let li = document.createElement('li');
          li.classList.add('mdl-menu__item');
          li.setAttribute('data-key', startup.key);
          li.innerHTML = startup.name;
          ELEMENTS.chooseStartupMenu.appendChild(li);
        });
        ELEMENTS.chooseStartupMenu.classList.add('mdl-menu',
            'mdl-menu--bottom-right', 'mdl-js-menu', 'mdl-js-ripple-effect');
        // Upgrade dynamicly created element to use MDL features.
        componentHandler.upgradeElement(ELEMENTS.chooseStartupMenu);
      }
    },
    updateStartup: function(startupKey) {
      let startup = firebaseApi.CACHE['startups'][startupKey];
      ELEMENTS.startupPageContent.innerHTML = '';
      ELEMENTS.startupShowNotes.classList.remove('lpa-open');
      ELEMENTS.startupNotes.innerHTML = '';
      ELEMENTS.startupNotes.classList.add('hidden');
      let node = fillStartupTemplate(ELEMENTS.startupPageTemplate, startup);
      node.querySelector('[data-field="twitter"]').setAttribute(
          'href', 'https://twitter.com/' + startup.twitter);
      let video;
      if (startup.video) {
        let youtubeIdMatch = startup.video.match(YOUTUBE_REGEX);
        if (youtubeIdMatch && youtubeIdMatch[1]) {
          video = document.createElement('iframe');
          video.setAttribute('height', 315);
          video.setAttribute('width', 560);
          video.setAttribute('src', 'https://www.youtube.com/embed/' + youtubeIdMatch[1]);
        }
        let vimeoIdMatch = startup.video.match(VIMEO_REGEX);
        if (vimeoIdMatch && vimeoIdMatch[1]) {
          video = document.createElement('iframe');
          video.setAttribute('height', 427);
          video.setAttribute('width', 640);
          video.setAttribute('src', 'https://player.vimeo.com/video/' + vimeoIdMatch[1]);
        }
        if (!youtubeIdMatch && !vimeoIdMatch) {
          video = document.createElement('a');
          video.classList.add('material-icons', 'lpa-icon-big');
          video.innerHTML = 'movie';
          if (!startup.video.startsWith('http')) {
            startup.video = 'http://' + startup.video;
          }
          video.setAttribute('href', startup.video);
          video.setAttribute('target', '_blank');
        }
        node.appendChild(video);
      }
      ELEMENTS.startupPageContent.appendChild(node);
    },
    displayStartupNotes: function(sessions) {
      ELEMENTS.startupNotes.innerHTML = '';
      if (sessions) {
        sessions.forEach(function(session) {
          let node = ELEMENTS.startupNotesTemplate.cloneNode(true);
          node.removeAttribute('id');
          node.classList.remove('lpa-template');
          node.querySelector('[data-field="date"]').innerText = session.date.slice(0, 10);
          node.querySelector('[data-field="mentor"]').innerText = session.mentorKey;
          node.querySelector('[data-field="notes"]').innerText = session.meetingNotes;
          node.querySelector('[data-field="action-items"]').innerText = session.actionItems;
          ELEMENTS.startupNotes.appendChild(node);
        });
      }
    },
    showSubpage: function(subpageName, itemKey) {
      let subpages = document.querySelectorAll('.lpa-subpage');
      for (var i = 0; i < subpages.length; i++) {
        subpages[i].classList.remove('lpa-active');
      }
      let subpage = document.getElementById('lpa-' + subpageName + '-subpage');
      PAGES[subpageName] && PAGES[subpageName].init && PAGES[subpageName].init(itemKey);
      subpage.classList.add('lpa-active');
      ELEMENTS.main.scrollTo(0, 0);
      return subpage;
    },
    displaySchedule: function(schedule) {
      ELEMENTS.scheduleList.innerHTML = '';
      if (schedule.length) {
        schedule.forEach(function(session) {
          let node = ELEMENTS.scheduleListTemplate.cloneNode(true);
          node.removeAttribute('id');
          node.classList.remove('lpa-template');
          node.querySelector('[data-field="starttime"]').innerText = session.starttime;
          node.querySelector('[data-field="location"]').innerText = session.location;
          node.querySelector('[data-field="startup"]').innerText = session.startup;
          ELEMENTS.scheduleList.appendChild(node);
          let mentorId = firebaseApi.CURRENT_MENTOR_ID;
          node.querySelector('.lpa-survey-btn').addEventListener(
              'click', UI.showSurvey.bind(null, session));
        });
      } else {
        ELEMENTS.scheduleList.innerHTML = '<li>Sorry, no sessions found for this date.</li>';
      }
    },
    showSurvey: function(session) {
      UI.resetSurvey(session);
      ELEMENTS.survey.showModal();
    },
    resetSurvey: function(session) {
      let startup = session ? session.startup : window.location.pathname.split('/')[3];
      if (startup) {
        ELEMENTS.survey.querySelector(
            '#lpa-survey-startup').value = startup;
        ELEMENTS.chooseStartup.classList.add('hidden');
      } else {
        ELEMENTS.chooseStartup.classList.remove('hidden');
      }
      startup = startup || 'a startup';
      ELEMENTS.survey.querySelector(
          '.mdl-dialog__title').innerHTML = 'Add notes for ' + startup;
      let today = new Date();
      let todayIso = today.toISOString();
      ELEMENTS.survey.session = session;
      let sessionText = session ?
          'Session: ' + session.date + ' at ' + session.starttime :
          'Unscheduled session: ' + todayIso.slice(0, 10) + ' ' + todayIso.slice(11, 16);
      ELEMENTS.survey.querySelector(
          '#lpa-survey-session-datetime').innerHTML = sessionText;
      let notes = session ? session.notes : {};
        ELEMENTS.survey.querySelector(
            '#lpa-survey-receptive').value = notes.receptive || 3;
        ELEMENTS.survey.querySelector(
            '#lpa-survey-effective').value = notes.effective || 3;
        ELEMENTS.surveyNotesField.innerHTML = notes.meetingNotes || '';
        ELEMENTS.surveyNotesField.parentNode.classList.toggle(
          'is-dirty', notes.meetingNotes);
        ELEMENTS.surveyActionItemsField.innerHTML = notes.actionitems || '';
        ELEMENTS.surveyNotesField.parentNode.classList.toggle(
          'is-dirty', !!notes.meetingNotes);
      ELEMENTS.surveyNotesField.parentNode.classList.remove('is-invalid');
      ELEMENTS.survey.querySelector('.lpa-survey-error').classList.add('hidden');
    },
    addListeners: function() {
      ELEMENTS.mainNav.addEventListener('click', navigate);
      ELEMENTS.userNav.addEventListener('click', e => {
        let links = ELEMENTS.mainNav.querySelectorAll('.is-active');
        for (var i = 0; i < links.length; i++) {
          links[i].classList.remove('is-active');
        }
        navigate(e);
      });
      ELEMENTS.drawerNav.addEventListener('click', function(e) {
        navigate(e);
        ELEMENTS.mdlLayout.MaterialLayout.toggleDrawer();
      });
      let signInEls = ELEMENTS.mdlLayout.querySelectorAll('.lpa-sign-in');
      for (var i = 0; i < signInEls.length; i++) {
        signInEls[i].addEventListener('click', e => {
          e.preventDefault();
          authModule.authWithGoogle();
        });
      }
      let signOutEls = ELEMENTS.mdlLayout.querySelectorAll('.lpa-sign-out');
      for (var i = 0; i < signOutEls.length; i++) {
        signOutEls[i].addEventListener('click', e => {
          e.preventDefault();
          authModule.signOut();
        });
      }
      ELEMENTS.datepicker.setAttribute('value', new Date().toISOString().slice(0, 10));
      ELEMENTS.datepicker.addEventListener('change', function(e) {
        firebaseApi.getCurrentMentorSchedule(
            e.target.value).then(UI.displaySchedule);
      });

      ELEMENTS.startupShowNotes.addEventListener('click', function(e) {
        e.preventDefault();
        ELEMENTS.startupShowNotes.classList.toggle('lpa-open');
        ELEMENTS.startupNotes.classList.toggle('hidden');
        let startupKey = window.location.pathname.split('/')[3];
        firebaseApi.fetchStartupNotes(startupKey).then(UI.displayStartupNotes);
      });

      if (!ELEMENTS.survey.showModal) {
        dialogPolyfill.registerDialog(ELEMENTS.survey);
      }

      ELEMENTS.survey.querySelector('.close').addEventListener('click', function() {
        ELEMENTS.survey.close();
      });

      ELEMENTS.chooseStartupMenu.addEventListener('click', function(e) {
        let startupKey = e.target.getAttribute('data-key');
        ELEMENTS.survey.querySelector(
            '#lpa-survey-startup').value = startupKey;
        ELEMENTS.survey.querySelector(
            '.mdl-dialog__title').innerHTML = 'Add notes for ' + startupKey;
      });

      ELEMENTS.surveyBtn.addEventListener('click', function() {
        let mentorId = firebaseApi.CURRENT_MENTOR_ID;
        UI.showSurvey();
      });
      ELEMENTS.survey.querySelector(
        '#lpa-survey-receptive').addEventListener('change', function(e) {
        ELEMENTS.survey.querySelector(
          'span[for="lpa-survey-receptive"]').innerHTML = e.target.value;
      });

      ELEMENTS.survey.querySelector(
        '#lpa-survey-effective').addEventListener('change', function(e) {
        ELEMENTS.survey.querySelector(
          'span[for="lpa-survey-effective"]').innerHTML = e.target.value;
      });

      ELEMENTS.survey.addEventListener('submit', e => e.preventDefault());
      ELEMENTS.surveySubmit.addEventListener('click', function(e) {
        e.preventDefault();
        let fields = ELEMENTS.survey.querySelector('form').elements;
        let session = ELEMENTS.survey.session;
        let startup = fields['lpa-survey-startup'].value;
        let imgs = [];
        let imgEls = ELEMENTS.mdlLayout.querySelectorAll('.lpa-survey-img');
        for (var i = 0; i < imgEls.length; i++) {
          imgs.push(imgEls[i].src);
        }
        let today = new Date();
        let note = {
          'actionItems' : fields['lpa-survey-actionitems'].value,
          'date' : today.toISOString(),
          'effective' : fields['lpa-survey-effective'].value,
          'endtime' : fields['lpa-survey-endtime'].value,
          'starttime' : fields['lpa-survey-starttime'].value,
          'meetingNotes' : fields['lpa-survey-notes'].value,
          'receptive' : fields['lpa-survey-receptive'].value,
          'imgs': imgs,
          'unixTime' : today.getTime()
        };

        let valid = true;
        if (!fields['lpa-survey-notes'].value) {
          fields['lpa-survey-notes'].parentNode.classList.add('is-invalid');
          valid = false;
        }
        if (!startup) {
          ELEMENTS.survey.querySelector(
              '.lpa-survey-error').classList.remove('hidden');
          valid = false;
        }
        if (valid) {
          firebaseApi.saveSessionNotes(note, startup, session).then(() => {
            ELEMENTS.survey.close();
          });
        }
      });

      ELEMENTS.startupsList.addEventListener('click', function(e) {
        navigate(e, 'LI');
      });
      ELEMENTS.profileSubmit.addEventListener('click', function(e) {
        let fields = ELEMENTS.profileForm.elements;
        let mentorId = firebaseApi.CURRENT_MENTOR_ID;
        let mentor = {
          'name': fields['lpa-profile-name'].value,
          'email': fields['lpa-profile-email'].value, // should be not editable?
          'phone': fields['lpa-profile-phone'].value,
          'country': fields['lpa-profile-country'].value,
          'city': fields['lpa-profile-city'].value,
          //'domain': fields['lpa-profile-name'].value,
          //'domainSec': $("#form-domain-sec-select option':selected").text(),
          'twitter': fields['lpa-profile-twitter'].value,
          'bio': fields['lpa-profile-bio'].value,
          'funFact': fields['lpa-profile-funfact'].value,
          'expertise': fields['lpa-profile-expertise'].value,
          'linkedin': fields['lpa-profile-linkedin'].value,
          'site': fields['lpa-profile-site'].value,
          'pic': fields['lpa-profile-pictureurl'].value,
          'comments': fields['lpa-profile-comments'].value,
          'unixTime': new Date().getTime(),
          'date': new Date().toISOString()
        };
        firebaseApi.saveMentor(mentorId, mentor);
      });
      ELEMENTS.camera.addEventListener('change', e => {
        let file = e.target.files[0];
        let link = document.createElement('a');
        link.setAttribute('target', '_blank');
        ELEMENTS.cameraPreview.appendChild(link);
        let imgUrl = URL.createObjectURL(file);
        link.setAttribute('style', 'background-image: url(\'' + imgUrl + '\')');
        let progressCallback = function(snapshot) {
            let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            link.innerHTML = Math.round(progress) + '%';
        };
        let completeCallback = function(snapshot) {
          link.setAttribute('href', snapshot.downloadURL);
          link.innerHTML = '';
        };
        firebaseApi.uploadImage(file, progressCallback, completeCallback);
      });
    }
  };

  const PAGES = {
    'startup': {
      init: UI.updateStartup
    }
  };
  return UI;
})(firebaseApi, authModule, router);
