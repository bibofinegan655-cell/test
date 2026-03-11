const baseState = {
  hp: 10,
  gold: 0,
  mana: 3,
  location: "晨雾村",
  inventory: ["旧地图"],
  log: ["你在晨雾村醒来，听见远方龙鸣。"],
  node: "village",
};

let state = structuredClone(baseState);

const nodes = {
  village: {
    title: "晨雾村",
    text: "薄雾笼罩村庄。铁匠说北方遗迹发出蓝光，酒馆老板提醒你森林里有妖精。",
    image: "assets/village.svg",
    choices: [
      {
        text: "前往银叶森林",
        next: "forest",
        effect: () => addLog("你踏入银叶森林，空气里有魔法花粉。"),
      },
      {
        text: "去古代遗迹调查蓝光",
        next: "ruins",
        requirement: () => state.inventory.includes("旧地图"),
        failureText: "没有地图会迷路，先准备一下。",
      },
      {
        text: "在市集打工赚金币",
        next: "village",
        effect: () => {
          state.gold += 2;
          addLog("你帮商队搬运货物，获得 2 金币。");
        },
      },
    ],
  },
  forest: {
    title: "银叶森林",
    text: "发光的蘑菇照亮小径。你听见树梢中有轻笑，一只妖精盘旋而下。",
    image: "assets/forest.svg",
    choices: [
      {
        text: "用 1 点魔力与妖精交流",
        next: "fairy",
        requirement: () => state.mana > 0,
        failureText: "你魔力不足，妖精对你失去兴趣。",
        effect: () => {
          state.mana -= 1;
          addLog("你施展微光咒语，妖精停在你肩上。");
        },
      },
      {
        text: "采集月露草（恢复生命）",
        next: "forest",
        effect: () => {
          state.hp = Math.min(10, state.hp + 2);
          addItem("月露草");
          addLog("你找到月露草，生命恢复 2 点。", "heal");
        },
      },
      { text: "返回晨雾村", next: "village" },
    ],
  },
  fairy: {
    title: "妖精契约",
    text: "妖精女王赐你一枚星尘符文，可在危机时保护你。她请求你封印遗迹中的裂隙。",
    image: "assets/fairy.svg",
    choices: [
      {
        text: "接受使命并前往遗迹",
        next: "ruins",
        effect: () => {
          addItem("星尘符文");
          state.mana += 2;
          addLog("你获得星尘符文，魔力 +2。", "heal");
        },
      },
      {
        text: "先回村补给",
        next: "village",
      },
    ],
  },
  ruins: {
    title: "古代遗迹",
    text: "残破石柱环绕着裂隙，黑雾溢出。你需要决定是硬闯、施法，还是使用符文。",
    image: "assets/ruins.svg",
    choices: [
      {
        text: "强行冲入裂隙",
        next: "ending_bad",
        effect: () => {
          state.hp -= 6;
          addLog("黑雾撕裂你的护甲，生命 -6。", "damage");
        },
      },
      {
        text: "消耗 3 点魔力进行封印",
        next: "ending_good",
        requirement: () => state.mana >= 3,
        failureText: "魔力不足，咒文在半空崩解。",
        effect: () => {
          state.mana -= 3;
          addLog("古咒点亮遗迹，裂隙缓缓闭合。");
        },
      },
      {
        text: "使用星尘符文安全封印",
        next: "ending_true",
        requirement: () => state.inventory.includes("星尘符文"),
        failureText: "你还没有星尘符文。",
        effect: () => {
          addLog("符文化作星环，完全净化了黑雾。", "heal");
          state.gold += 10;
        },
      },
      { text: "撤退回村", next: "village" },
    ],
  },
  ending_bad: {
    title: "黯影结局",
    text: "你受伤逃离遗迹。裂隙仍在扩张，王国进入长期戒备。你活了下来，但故事尚未结束。",
    image: "assets/ending_bad.svg",
    ending: true,
    choices: [{ text: "开启下一轮冒险", next: "village", reset: true }],
  },
  ending_good: {
    title: "守护者结局",
    text: "你以魔力封印裂隙，被授予“晨雾守护者”称号。新的区域将在后续版本开放。",
    image: "assets/ending_good.svg",
    ending: true,
    choices: [{ text: "继续探索（重开）", next: "village", reset: true }],
  },
  ending_true: {
    title: "星辉结局",
    text: "你与妖精缔结盟约，彻底净化遗迹。金币与名望涌来，远方浮空城向你发出邀请。",
    image: "assets/ending_true.svg",
    ending: true,
    choices: [{ text: "以传奇身份再出发", next: "village", reset: true }],
  },
};

const hpEl = document.querySelector("#hp");
const goldEl = document.querySelector("#gold");
const manaEl = document.querySelector("#mana");
const locationEl = document.querySelector("#location");
const titleEl = document.querySelector("#scene-title");
const textEl = document.querySelector("#scene-text");
const imageEl = document.querySelector("#scene-image");
const choicesEl = document.querySelector("#choices");
const inventoryEl = document.querySelector("#inventory-list");
const logEl = document.querySelector("#log-list");
const restartBtn = document.querySelector("#restart-btn");

restartBtn.addEventListener("click", () => {
  state = structuredClone(baseState);
  addLog("你重新整理行囊，再次踏上旅程。", "heal");
  render();
});

function addItem(item) {
  if (!state.inventory.includes(item)) {
    state.inventory.push(item);
    addLog(`获得物品：${item}`);
  }
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 8);
}

function choose(choice) {
  if (choice.reset) {
    state = structuredClone(baseState);
    addLog("新的传说从这里开始。", "heal");
  }

  if (choice.requirement && !choice.requirement()) {
    addLog(choice.failureText || "条件不足，无法执行。", "damage");
    render();
    return;
  }

  if (choice.effect) {
    choice.effect();
  }

  state.node = choice.next;
  state.location = nodes[choice.next].title;

  if (state.hp <= 0) {
    state.node = "ending_bad";
    state.location = nodes.ending_bad.title;
    addLog("你失去意识，被路过的旅人救回村庄。", "damage");
  }

  render();
}

function renderChoices(node) {
  choicesEl.innerHTML = "";
  node.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-btn";
    button.textContent = choice.text;
    button.addEventListener("click", () => choose(choice));
    choicesEl.appendChild(button);
  });
}

function renderStatus() {
  hpEl.textContent = state.hp;
  goldEl.textContent = state.gold;
  manaEl.textContent = state.mana;
  locationEl.textContent = state.location;

  inventoryEl.innerHTML = state.inventory.map((item) => `<li>${item}</li>`).join("");
  logEl.innerHTML = state.log.map((msg) => `<li>${msg}</li>`).join("");
}

function render() {
  const node = nodes[state.node];
  titleEl.textContent = node.title;
  textEl.textContent = node.text;
  imageEl.src = node.image;
  imageEl.alt = `${node.title} 场景插画`;

  renderChoices(node);
  renderStatus();

  if (node.ending) {
    textEl.innerHTML = `<span class="ending">${node.text}</span>`;
  }
}

render();
