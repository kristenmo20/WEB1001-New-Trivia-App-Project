let lStore = window.localStorage;
let sStore = window.sessionStorage;

sStore.setItem("user-score", 0);

function makeHash(string) {
  let ints = [...string].map(char => char.charCodeAt(0));
  let hash = ints.reduce((acc, code) => {
    return (acc << 5) - acc + code;
  }, 0);
  return (hash |= 0);
}

function clearChildren(node) {
  [...node.children].forEach(node => {
    let cNode = node.cloneNode(false);
    node.parentNode.replaceChild(cNode, node);
  });
}

function updateHeader() {
  ["user-name", "user-score"].forEach(item => {
    let ele = document.querySelector(`header #info #${item}`);
    ele.innerText = !lStore.getItem(item)
      ? sStore.getItem(item)
      : lStore.getItem(item);
  });
}

function getTemplate(tplId) {
  if (!window.templates) {
    window.templates = {};
  }
  if (!window.templates[tplId]) {
    window.templates[tplId] = document.querySelector(
      `template#${tplId}`
    ).content;
  }

  return document.importNode(window.templates[tplId], true);
}

function showNameTemplate() {
  let tplId = "tplNameForm";
  let main = document.querySelector("main");
  let children = Array.from(main.childNodes.values());
  children.forEach(child => {
    main.removeChild(child);
  });
  let tpl = getTemplate(tplId);
  main.appendChild(tpl);
}

function shake(ele) {
  ele.addEventListener("animationend", evt => {
    evt.target.classList.remove("shake");
  });
  ele.classList.add("shake");
}

function fadeout(ele) {
  let main = document.querySelector("main");
  ele.addEventListener("animationend", evt => {
    main.removeChild(ele);
    getQuestions();
  });
  ele.classList.add("fadeout");
}

function sendChat(evt) {
  evt.preventDefault();
  let chat = evt.target;
  let value = chat.querySelector("#chatbox").value;
  let chatlog = document.querySelector("#chat-log");
  let tpl = getTemplate("tplChat");
  tpl.querySelector(".name").innerText = lStore.getItem("user-name");
  tpl.querySelector(".message").innerText = value;
  chatlog.appendChild(tpl);
}

function answerSelected(evt) {
  evt.preventDefault();
  let ele = evt.target;
  let inputs = [...evt.target.parentNode.parentNode.querySelectorAll('input')];
  inputs.forEach(ele => {
    ele.disabled = true;
  });
  let corr_hash = sStore.getItem('corr_hash')
  if (corr_hash == evt.value) {
    let score = (sStore.getItem('user-score') | 0);
    score += 10;
    sStore.setItem('user-score', score);
  }
  updateHeader();
  getQuestions();
}

function getQuestions() {
  fetch("https://opentdb.com/api.php?amount=1")
    .then(data => data.json())
    .then(json => json.results)
    .then(questions => {
      let q = questions.pop();
      let q_text = q.question;
      q.incorrect_answers.push(q.correct_answer);
      q.incorrect_answers.sort((eleA, eleB) => {
        let a = makeHash(eleA);
        let b = makeHash(eleB);

        // if a < b return -1
        if (a < b) return -1

        // if a > b return 1
        if (a > b)  return 1

        // if a == b return 0 
        return 0;
      });
      sStore.setItem('corr_hash', makeHash(q.correct_answer));
      let q_opts = q.incorrect_answers.map(answer => {
        let hash = makeHash(answer);
        let holder = document.createElement("div");
        let opt = document.createElement("input");
        opt.addEventListener('change', answerSelected);
        let label = document.createElement("label");
        holder.appendChild(opt);
        holder.appendChild(label);
        Object.assign(opt, {
          type: "radio",
          name: "answer",
          id: hash,
          value: hash
        });
        Object.assign(label, {
          htmlFor: hash
        });
        label.innerHTML = answer;
        holder.classList.add('hidden');
        holder.classList.add('racein');
        return holder;
      });

      let tpl = getTemplate("tplQuestion");

      let answers = tpl.querySelector("#answers");
      tpl.querySelector("#question").innerHTML = q_text;
      q_opts.forEach(ans => answers.appendChild(ans));
      let main = document.querySelector("main");
      let child = main.firstElementChild;
      if (child) {
        child.classList.remove('fadein');
        child.classList.add('fadeout');
        child.addEventListener('animationend', () => {
          main.replaceChild(tpl, child);
        });
      } else {
        main.appendChild(tpl);
      }
      
      
    });
}

let chat = document.querySelector("#chat-controls");
chat.addEventListener("submit", sendChat);

showNameTemplate();