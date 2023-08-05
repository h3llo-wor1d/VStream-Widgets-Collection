const options = window.options;

function defaultChatMessageTemplate() {
    let avatarBlock = `<img id="pic" class="message-{from}-avatar" src="{default_avatar}" alt="">`;

    return `<div class="{from}-id" data-from="{from}" data-id="{messageId}">
    ${!options.compact ? avatarBlock : ""}
    <div class="message">
    	<div class="author" style="color: {color}">
      	<div class="badges"></div>
      	<div class="name">{from}</div>
      </div>
      <div class="chat tier"><span>{message}</span></div>
    </div>
  </div>`
}

const getItemTemplate = () => {
    return `
    <div data-from="{from}" data-id="{messageId}">
    <span class="meta" style="color: {color}">
        <span class="badges">
        </span>
        <span class="name">{from}</span>
    </span>

    <span class="message">
        {message}
    </span>
    </div>   
    `
}

const addBadge = (message, type, src) => {
    var n = '<img src="{src}" class="badge {type}-icon"/>';
    n = (n = n.replace(/{src}/gi, src)).replace(/{type}/gi, type);
    message = a(message);
    message.querySelector(".badges").appendChild(a(n));
    return message.outerHTML;
}

const addEmote = (url) => {
    return '<span class="emote" style="background-image: url('.concat(url, ');"><img src="').concat(url, '"/></span>')
}

const a = (o) => {
    let e = document.createElement("div");
    e.innerHTML = o;
    return e.firstChild;
}

var defaultRight = false;

const getDetails = async (videoID) => {
    let f1 = await fetch(`https://vstream.com${videoID}?_data=routes%2Fv.%24videoID`);
    let f2 = await f1.json();
    return {
        channelID: f2.video.channelID, 
        chatRoomURL: f2.video.chatRoomWSURL,
        videoID: f2.canonicalURL.split("/v/")[1]
    };
} 

const getStream = async () => {
    let f1 = await fetch(`https://vstream.com/c/@${options.username}`);
    let f2 = await f1.text();
    const $ = window.cheerio.load(f2, null, false);
    for (var el of $('a[title]').get()) {
        let h = $(el).attr('href');
        if (h.startsWith('/v/')) {
            return h
        }
    }
}

const formatMessage = async (message) => {
    var o = defaultChatMessageTemplate();
    var m = message.body;

    if (message.emotes.length > 0) {
        message.emotes.forEach(emote => {
            m += " "+addEmote(emote)
        })
    }

    o = o.replace(/{from}/gi, message.chatter.name).replace(/{color}/gi, message.chatter.color).replace(/{message}/gi, m).replace(/{default_avatar}/gi, message.chatter.pfp);
    if (message.chatter.badges.length > 0) {
        message.chatter.badges.forEach(type => {
            o = addBadge(o, "platform", `badges/${type}.png`)
        })
    }
    let e = a(o);
    if (defaultRight) { 
        e.querySelector(".chat").classList.add('bubbleRight')
        e.querySelector('.chat').style.backgroundColor = message.chatter.color;
        e.classList.add('justifyRight');
    } else {
        e.querySelector('.chat').style.backgroundColor = message.chatter.color;
        e.querySelector(".chat").classList.add('bubbleLeft');
    }

    document.getElementById('log').appendChild(e);
}
var vstreamClient = null;

function separateEmoji(text) {
    var re = /<img .*?>/g;

    var m;
    var result = []
    do {
        m = re.exec(text);
        if (m) {
            result.push(m[0].split("\"")[1].split("\"")[0]);
        }
    } while (m);

    return [text.replace(/<img .*?>/g,""), result]
}

class ChatClient {
    channelID;
    chatRoomURL;
    videoID;
    client;
    pingInterval;

    constructor(dat) {
        this.channelID = dat.channelID;
        this.chatRoomURL = dat.chatRoomURL;
        this.videoID = dat.videoID;
    }

    connect = async () => {
        let self = this;

        const socket = new WebSocket(this.chatRoomURL);

        socket.addEventListener("message", async (event) => {
            if (!(event.data instanceof Blob)) {
                return;
              }
        
            const buffer = new Uint8Array(await event.data.arrayBuffer());
            let parsed = await window.incomingHandler(buffer);
            if (parsed) {
                let text = separateEmoji(parsed.text);
                formatMessage({
                    body: text[0],
                    chatter: {
                        name: parsed.profile.displayName,
                        color: `rgb(${parsed.profile.color.join(",")})`,
                        badges: parsed.profile.badges,
                        pfp: parsed.profile.avatar.split("?")[0]+"?dpr=1&auto=format%2Ccompress&faceindex=1&facepad=2.4&fit=crop&h=128&mask=ellipse&w=128&s=19b02d4812f7f4c32e79aa44b768ae98"
                    },
                    emotes: text[1]
                });
            }
        });

        this.pingInterval = setInterval(() => {
            socket.send('\"PING\"')
        }, 10000)
    }
}

async function init() {
    let vID = await getStream();
    let details = await getDetails(vID)
    vstreamClient = new ChatClient(details)
    vstreamClient.connect();
}