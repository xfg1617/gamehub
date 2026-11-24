    /* =========================================================================
       LEGAL: Terms of Service + Privacy Policy (13 and up). A TEMPLATE written in plain English for a U.S. site,
       to be reviewed by a lawyer before launch. LEGAL_INFO filled in by Inna (Nov 2026).
       Opened from the footer links, the sign-up box, and #terms / #privacy in the address.
       ========================================================================= */
    const LEGAL_INFO = {
      site: 'GameHub',
      owner: 'GameHub',
      contact: 'quangchuongnguyen63@gmail.com',
      state: 'the State of Indiana',
      updated: 'November 2026',
    };
    function legalText(kind) {
      const L = LEGAL_INFO, h = (t) => `<h3 class="text-lg font-extrabold text-bone pt-3">${t}</h3>`, p = (t) => `<p class="text-sm text-muted leading-relaxed">${t}</p>`;
      const li = (items) => `<ul class="text-sm text-muted leading-relaxed list-disc pl-5 space-y-1">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
      if (kind === 'privacy') return `
        ${p(`<b>Last updated:</b> ${L.updated}. This Privacy Policy explains what ${L.site} ("we") collects when you use the site, why, and the choices you have.`)}
        ${h('Who can use GameHub')}${p(`${L.site} is for people <b>13 years old and older</b>. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has given us information, email us at ${L.contact} and we will delete it.`)}
        ${h('What we collect')}${li([
          '<b>Your player name and avatar</b>, which other players can see.',
          '<b>Your game progress</b>: XP, levels, stats, streaks, match history and rankings.',
          '<b>Your email address</b>, only if you create an account (with email and password, or with Google). If you use Google, we receive your email address and basic profile from Google; we never see your Google password.',
          '<b>Chat messages</b> you send in the global, game and table chats, and reports you make about messages.',
          '<b>Basic technical data</b> needed to run online games, such as when you were last connected to a game.',
        ])}
        ${p('We do <b>not</b> collect payment details, your location, or your contacts, and the site has no advertising trackers.')}
        ${h('How we use it')}${li(['To run the games, rooms, chat, leaderboards and rankings.', 'To save your progress so you can continue on any device.', 'To keep the site safe: filtering rude words, limiting spam, and reviewing reported messages.', 'To answer you when you contact us.'])}
        ${p('We do <b>not</b> sell your personal information, and we do not share it for advertising.')}
        ${h('Where it is stored')}${p(`Online data is stored with our hosting and database provider (Supabase), which processes it on our behalf. Some data, like your settings and guest progress, is also stored in your own browser. Guests get an anonymous account that is not linked to an email address.`)}
        ${h('How long we keep it')}${p('We keep your account data while your account exists. Chat messages may be removed over time. Guest data that is not linked to an account may be deleted after a long period of inactivity.')}
        ${h('Your choices and rights')}${li([`You can change your player name and avatar at any time.`, `You can ask us to see, correct or delete your account data by emailing ${L.contact}. We will reply within 30 days.`, 'You can clear the data stored in your browser through your browser settings.', 'Depending on where you live (for example, California), you may have extra rights under local law. We will honor them.'])}
        ${h('Security')}${p('We use standard protections (encrypted connections and per-account access rules), but no online service is perfectly secure. Please use a password you do not use anywhere else.')}
        ${h('Changes')}${p('If we change this policy, we will update the date at the top. Big changes will also be announced on the site.')}
        ${h('Contact')}${p(`${L.owner} · ${L.contact}`)}`;
      return `
        ${p(`<b>Last updated:</b> ${L.updated}. These Terms are an agreement between you and ${L.owner} ("we") about using ${L.site}. By using the site you agree to them.`)}
        ${h('1. Who can play')}${p(`You must be <b>at least 13 years old</b> to use ${L.site}. If you are under 18, please make sure a parent or guardian is okay with you using it.`)}
        ${h('2. Your account')}${li(['You can play as a guest or create an account. Keep your password private; you are responsible for what happens on your account.', 'Pick a player name that is not offensive and does not pretend to be someone else. We may change or remove names that break these rules.', 'One person, one account. Do not buy, sell or share accounts.'])}
        ${h('3. Playing fair and being kind')}${p('When you play or chat, you agree not to:')}${li(['harass, bully, threaten or use hateful language toward anyone;', 'share anyone’s personal information (including your own phone number or address) in chat;', 'cheat, use bots or scripts, exploit bugs, or manipulate rankings (for example by losing on purpose to a friend);', 'spam, advertise, or post links to harmful or adult content;', 'try to break, overload or hack the site.'])}
        ${p('We may remove messages, reset stats, or suspend or close accounts that break these rules.')}
        ${h('4. Chips, XP and rankings have no money value')}${p(`Chips, XP, levels, badges and rankings in ${L.site} are just for fun. They <b>cannot</b> be bought, sold, or exchanged for money or prizes. Poker and Blackjack use play chips only; ${L.site} does not offer real-money gambling.`)}
        ${h('5. Our content and copyright')}${p(`© ${new Date().getFullYear()} ${L.owner}. All rights reserved. The ${L.site} name and logo, the games' names, rules text, artwork, characters, pixel art, sounds, music and code are owned by ${L.owner} and protected by copyright law. You may play and share links to the site, but you may not copy, download and re-host, sell, or make your own version of the site or any part of it without our written permission.`)}${p(`Our games are original: some are inspired by classic game types (for example property trading or hidden-role games), but they use their own names, rules wording, characters and art. They are not affiliated with, or endorsed by, the makers of any other game.`)}${p(`If you believe something on ${L.site} uses your work without permission, contact us at ${L.contact} and we will look into it promptly.`)}${h('6. Your content')}${p('You keep ownership of what you write and draw (like chat messages and Doodle Chain drawings), but you let us show it to other players as part of the games.')}
        ${h('7. Changes and availability')}${p(`We may update, add or remove games and features at any time. We try to keep ${L.site} running smoothly, but it may sometimes be unavailable, and online progress could occasionally be lost.`)}
        ${h('8. Disclaimer and limits')}${p(`${L.site} is provided "as is", without warranties of any kind. To the extent the law allows, we are not responsible for indirect losses, and our total liability to you is limited to $50.`)}
        ${h('9. Ending your use')}${p(`You can stop using ${L.site} at any time and ask us to delete your account at ${L.contact}. We may suspend or end access for anyone who breaks these Terms.`)}
        ${h('10. The law that applies')}${p(`These Terms are governed by the laws of ${L.state}, United States, without regard to its conflict-of-law rules.`)}
        ${h('11. Changes to these Terms')}${p('If we change these Terms, we will update the date at the top. If you keep using the site after a change, you accept the new Terms.')}
        ${h('Contact')}${p(`${L.owner} · ${L.contact}`)}`;
    }
    function openLegal(kind) {
      kind = kind === 'privacy' ? 'privacy' : 'terms';
      let el = document.getElementById('legal-modal');
      if (!el) { el = document.createElement('div'); el.id = 'legal-modal'; el.className = 'hidden fixed inset-0 z-[70] bg-black/85 overflow-y-auto p-4'; document.body.appendChild(el); el.onclick = (e) => { if (e.target === el) el.classList.add('hidden'); }; }
      el.innerHTML = `<div class="win max-w-2xl mx-auto my-6 overflow-hidden"><div class="winbar amber"><span>${kind === 'privacy' ? 'PRIVACY POLICY' : 'TERMS OF SERVICE'}</span><button class="pix text-sm" id="legal-x" aria-label="Close">✕</button></div>
        <div class="p-5 space-y-2"><div class="seg w-full mb-2"><button class="seg-btn flex-1 ${kind === 'terms' ? 'on' : ''}" data-lg="terms">Terms of Service</button><button class="seg-btn flex-1 ${kind === 'privacy' ? 'on' : ''}" data-lg="privacy">Privacy Policy</button></div>
        <div class="tip text-xs text-muted"><span class="tip-tag bg-coral">13+</span>GameHub is for players 13 and older.</div>${legalText(kind)}</div></div>`;
      el.classList.remove('hidden');
      el.querySelector('#legal-x').onclick = () => el.classList.add('hidden');
      el.querySelectorAll('[data-lg]').forEach((b) => { b.onclick = () => openLegal(b.dataset.lg); });
    }
    window.openLegal = openLegal;
    // footer links + #terms / #privacy in the address
    (function addLegalLinks() {
      const foot = document.querySelector('.foot-inner > div');
      if (foot && !document.getElementById('legal-links')) foot.insertAdjacentHTML('beforeend', '<span id="legal-links" class="flex gap-3"><a href="#terms" onclick="openLegal(\'terms\');return false" class="hover:text-bone underline">Terms</a><a href="#privacy" onclick="openLegal(\'privacy\');return false" class="hover:text-bone underline">Privacy</a><span>13+</span></span>');
      const h = (location.hash || '').slice(1);
      if (h === 'terms' || h === 'privacy') setTimeout(() => openLegal(h), 300);
    })();
