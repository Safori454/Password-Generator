(function(){
      // DOM refs
      const out = document.getElementById('passwordOutput');
      const copyBtn = document.getElementById('copyBtn');
      const genBtn = document.getElementById('generateBtn');
      const lengthInput = document.getElementById('lengthInput');
      const lowercase = document.getElementById('lowercase');
      const uppercase = document.getElementById('uppercase');
      const numbers = document.getElementById('numbers');
      const symbols = document.getElementById('symbols');
      const meterBar = document.getElementById('meterBar');
      const strengthLabel = document.getElementById('strengthLabel');
      const entropyEl = document.getElementById('entropy');
      const lenHint = document.getElementById('lenHint');
      const charsHint = document.getElementById('charsHint');
      const darkToggle = document.getElementById('darkToggle');
      const modeButtons = document.querySelectorAll('.mode-btn[data-theme]');

      // theme state
      function applyTheme(themeName){
        // remove theme classes
        document.body.classList.remove('clean','glass','dark','neon');
        if(themeName === 'glass') {
          document.body.classList.add('glass'); // glass default
          // Also ensure body.dark not set unless dark toggle checked
        } else if(themeName === 'clean') {
          document.body.classList.add('clean');
        } else if(themeName === 'dark') {
          document.body.classList.add('dark');
        } else if(themeName === 'neon') {
          document.body.classList.add('neon');
        }
        // update aria-pressed
        modeButtons.forEach(b => b.setAttribute('aria-pressed', b.dataset.theme === themeName ? 'true' : 'false'));
      }

      // map chosen theme to body classes. Initialize default = glass
      applyTheme('glass');

      // connect left-side theme toggles
      modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const theme = btn.dataset.theme;
          applyTheme(theme);
          // if dark theme chosen, check dark toggle; else uncheck
          darkToggle.checked = (theme === 'dark');
        });
      });

      // dark mode toggle (keeps theme switcher in sync)
      darkToggle.addEventListener('change', (e) => {
        if(e.target.checked){
          applyTheme('dark');
        } else {
          // if user unchecks, return to glass (or keep current non-dark selection)
          applyTheme('glass');
        }
      });

      // utility: secure random index
      function randInt(max){
        // secure random
        const arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        return arr[0] % max;
      }

      // character sets
      const sets = {
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*()-_=+[]{};:,.<>/?'
      };

      function getActiveChars(){
        let s = '';
        if(lowercase.checked) s += sets.lowercase;
        if(uppercase.checked) s += sets.uppercase;
        if(numbers.checked) s += sets.numbers;
        if(symbols.checked) s += sets.symbols;
        return s;
      }

      function generatePassword(){
        const length = Math.max(4, Math.min(64, parseInt(lengthInput.value) || 12));
        const chars = getActiveChars();
        if(!chars){
          alert('Select at least one character type (lowercase, uppercase, numbers, or symbols).');
          return '';
        }
        let pw = '';
        // ensure at least one of each selected type appears (improves strength)
        const selectedSets = [];
        if(lowercase.checked) selectedSets.push(sets.lowercase);
        if(uppercase.checked) selectedSets.push(sets.uppercase);
        if(numbers.checked) selectedSets.push(sets.numbers);
        if(symbols.checked) selectedSets.push(sets.symbols);

        // place one guaranteed char from each selected set (shuffle positions)
        const guarantee = [];
        for(const set of selectedSets){
          guarantee.push(set[randInt(set.length)]);
        }

        // fill remaining
        for(let i=0;i<length - guarantee.length;i++){
          pw += chars[randInt(chars.length)];
        }

        // insert guarantees at random positions
        for(const ch of guarantee){
          const pos = pw.length > 0 ? randInt(pw.length + 1) : 0;
          pw = pw.slice(0,pos) + ch + pw.slice(pos);
        }

        return pw;
      }

      // strength estimator (simple entropy-based approx)
      function estimateStrength(pw){
        // number of possible symbols used
        let pool = 0;
        if(/[a-z]/.test(pw)) pool += sets.lowercase.length;
        if(/[A-Z]/.test(pw)) pool += sets.uppercase.length;
        if(/[0-9]/.test(pw)) pool += sets.numbers.length;
        if(/[^A-Za-z0-9]/.test(pw)) pool += sets.symbols.length;
        // fallback: if pool 0 set to 1 to avoid log(0)
        pool = Math.max(1, pool);
        // entropy bits = length * log2(pool)
        const bits = Math.round( (pw.length * Math.log2(pool)) );
        return bits; // integer bits
      }

      function updateUI(pw){
        out.value = pw;
        lenHint.textContent = pw.length;
        // which sets active in output (for display)
        const types = [];
        if(/[a-z]/.test(pw)) types.push('a');
        if(/[A-Z]/.test(pw)) types.push('A');
        if(/[0-9]/.test(pw)) types.push('0');
        if(/[^A-Za-z0-9]/.test(pw)) types.push('#');
        charsHint.textContent = types.join('') || '—';

        // strength
        const bits = estimateStrength(pw);
        entropyEl.textContent = bits + ' bits';
        // map bits to label & meter %
        // heuristics: <28 weak, 28-50 medium, >50 strong
        let width = Math.min(100, Math.round((bits / 80) * 100));
        width = Math.max(6, width);
        meterBar.style.width = width + '%';

        if(bits < 28){
          strengthLabel.textContent = 'Weak';
          meterBar.style.background = getComputedStyle(document.documentElement).getPropertyValue('--weak') || '#ef4444';
        } else if(bits < 50){
          strengthLabel.textContent = 'Medium';
          meterBar.style.background = getComputedStyle(document.documentElement).getPropertyValue('--medium') || '#f59e0b';
        } else {
          strengthLabel.textContent = 'Strong';
          meterBar.style.background = getComputedStyle(document.documentElement).getPropertyValue('--strong') || '#10b981';
        }
      }

      // generate initial password on load
      function doGenerate(focus=true){
        const p = generatePassword();
        if(p){
          updateUI(p);
          if(focus) out.select();
        }
      }

      // initial seed
      doGenerate(false);

      // event listeners
      genBtn.addEventListener('click', () => doGenerate(true));
      lengthInput.addEventListener('change', () => {
        // keep length within bounds
        let v = parseInt(lengthInput.value) || 12;
        v = Math.max(4, Math.min(64, v));
        lengthInput.value = v;
      });

      // when any option changes, regenerate
      [lowercase, uppercase, numbers, symbols].forEach(el => {
        el.addEventListener('change', () => doGenerate(false));
      });

      // copy to clipboard with animation
      copyBtn.addEventListener('click', async () => {
        try{
          await navigator.clipboard.writeText(out.value || '');
          // animate
          copyBtn.classList.add('copied');
          const prev = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.textContent = prev || 'Copy';
          }, 1400);
        }catch(e){
          // fallback: select and execCommand
          out.select();
          document.execCommand('copy');
          copyBtn.classList.add('copied');
          const prev = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.textContent = prev || 'Copy';
          }, 1200);
        }
      });

      // keyboard: Enter on length should generate
      lengthInput.addEventListener('keydown', (ev) => {
        if(ev.key === 'Enter') { doGenerate(true); }
      });

      // also allow Ctrl+G to generate quickly
      window.addEventListener('keydown', (ev) => {
        if((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'g'){
          ev.preventDefault();
          doGenerate(true);
        }
      });

      // accessibility: focus visible polyfill for keyboard users
      document.addEventListener('keydown', function(e){
        if(e.key === 'Tab') document.body.classList.add('user-is-tabbing');
      });

      // allow clicking outside to deselect (nice but optional)
      document.addEventListener('click', e => {
        // nothing for now
      });

    })();