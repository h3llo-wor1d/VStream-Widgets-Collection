const options = document.styleOptions;

async function loadOptions() {
    var newFontStyleSheet = document.createElement("style");
    
    let fontName = options.fontFile.split(".")[0];
    var font = new FontFace(`${fontName}`, `url("${options.fontFile}")`)
    font.load().then(function(loaded_face) {
        document.fonts.add(loaded_face)
        newFontStyleSheet.textContent = `
        body {
            margin: 0;
            font-size: ${options.textSize}px;
            color: ${options.textColor};
            font-family: ${fontName};
        }
        #newName {
            text-color: ${options.nameColor};
        }
        `;
        document.head.appendChild(newFontStyleSheet);
        document.head.removeChild(document.getElementById('configurableOptions'));
    });
    document.getElementById("gif").src = options.media;
}

window.names = [];
window.latest = "";

const onNewFollower = async (follower) => {
    const newspaperSpinning = [
        { opacity: "0" },
        { opacity: "1" },
        { opacity: "1"},
        { opacity: "0"}
    ];

    const newspaperTiming = {
        duration: document.styleOptions.duration*1000,
        iterations: 1,
    };
    document.getElementById("newName").innerHTML = follower;
    document.getElementById("popup").animate(newspaperSpinning, newspaperTiming);
    document.getElementById("gif").src = document.styleOptions.media;
    new Audio(document.styleOptions.sound).play();
}

const initFollowers = async () => {
    let f1 = await fetch(`https://vstream.com/c/@${options.username}/followers`)
    $($.parseHTML(await f1.text())).find(`a[href*="/c/@"]`).each(function(){
        let name = $(this).attr('href')
        if (
            name.startsWith("/c/@") && 
            names.indexOf(name) === -1 && 
            name !== `/c/@${options.username}`
        ) {
            window.names.push(name);
        }
    })
}

const getFollowers = async () => {
    let f1 = await fetch(`https://vstream.com/c/@${options.username}/followers`)

    $($.parseHTML(await f1.text())).find(`a[href*="/c/@"]`).each(function(){
        let name = $(this).attr('href')
        if (
            name.startsWith("/c/@") && 
            names.indexOf(name) === -1 && 
            name !== `/c/@${options.username}`
        ) {
            if (window.names !== [] && window.names.indexOf(name) === -1) {
                window.latest = name.replace("/c/@", "");
                window.names.push(name);
                console.log(window.latest)
                onNewFollower(name.replace("/c/@", ""))
            }
        }
    })
}

function onLoad() {
    loadOptions();
    initFollowers();
    setInterval(getFollowers, 500);
}