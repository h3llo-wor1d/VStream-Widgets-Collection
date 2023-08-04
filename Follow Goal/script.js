const options = document.styleOptions;

async function runModule() {
    await getFollowers();
    setInterval(getFollowers, 500);
}

async function getFollowers() {
    let f1 = await fetch(`https://vstream.com/c/${options.username}`);
    const followerGoal = options.followerGoal;
    const followerGoalMessage = options.followerGoalMessage;
    var followerCount = 0;
    let q = `/c/@${options.username}/followers`
    followerCount = parseInt($($.parseHTML(await f1.text())).find(`a[href*="${q}"]`)[0].innerText.split(" followers")[0]);
    goal = Math.round(followerCount/followerGoal);
    document.getElementById("feed").innerHTML = `
<div class="goalMessage">${followerGoalMessage}</div>
<div class="progressText">${followerCount}/${followerGoal}</div>
    <progress value="${followerCount}" max=${followerGoal}></progress>
<div class="goalLeft">0</div>
<div class="goalRight">${followerGoal}</div>
`;
    
}

async function loadOptions() {
    var newFontStyleSheet = document.createElement("style");
    
    let fontName = options.fontFile.split(".")[0];
    var font = new FontFace(`${fontName}`, `url("${options.fontFile}")`)
    font.load().then(function(loaded_face) {
        document.fonts.add(loaded_face)
        newFontStyleSheet.textContent = `
        body {
            margin: 0;
            font-size: 22px;
            color: #ffffff;
            font-family: ${fontName};
        }
        progress[value]::-webkit-progress-value {
            background-color: ${options.defaultBarColor};
        }
        `;
        document.head.appendChild(newFontStyleSheet);
        document.head.removeChild(document.getElementById('configurableOptions'));
    });
}

async function onLoad() {
    await loadOptions();
    await runModule();
}