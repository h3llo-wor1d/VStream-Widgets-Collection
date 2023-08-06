
const EnvelopeKeyMap = {
    __typename: -4,
    channelID: -3,
    chatID: -2,
    id: -1,
    isVTuber: 0,
    pfp: 1,
    timestamp: 2,
    url: 3,
    userID: 4,
    username: 5,
};

Element.prototype.remove = function() {
  this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
  for(var i = this.length - 1; i >= 0; i--) {
      if(this[i] && this[i].parentElement) {
          this[i].parentElement.removeChild(this[i]);
      }
  }
}
  
const decoder = window.Decoder;

const handlers = {
    ChatCreatedEvent(message) {
      return {
        type: 'chat-message',
        event: {
          id: message.chat.id,
          profile: {
            id: message.chat.chatter.userID,
            channelId: message.chat.chatter.channelID,
            displayName: message.chat.chatter.username,
            avatar: message.chat.chatter.pfp.url,
            badges: message.chat.chatterBadges,
            color: message.chat.chatterColor,
          },
          text: message.chat.nodes.reduce(buildHtmlMessage, ''),
        },
      };
    },
    ChatDeletedEvent(message) {
      return {
        type: 'chat-deleted',
        event: {
          id: message.chat.id,
        },
      };
    },
    UserChatsDeletedEvent(message) {
      return {
        type: 'chat-deleted',
        event: {
          userId: message.userID,
        },
      };
    },
    UserBannedEvent(message) {
      return [
        {
          type: 'user-removed',
          event: {
            userId: message.userID,
          },
        },
        {
          type: 'chat-deleted',
          event: {
            userId: message.userID,
          },
        }];
    },
    UserTimedOutEvent(message) {
      return [
        {
          type: 'user-removed',
          event: {
            userId: message.userID,
          },
        },
        {
          type: 'chat-deleted',
          event: {
            userId: message.userID,
          },
        }];
    },
    ViewerJoinedEvent(message) {
      const badges = [];
      if (message.viewer.isVTuber) {
        badges.push('streamer');
      }
      if (message.viewer.isModerator) {
        badges.push('moderator');
      }
      return {
        type: 'user-added',
        event: {
          id: message.viewer.userID,
          channelId: message.viewer.channelID,
          displayName: message.viewer.displayName,
          username: message.viewer.username,
          avatar: message.viewer.pfp.src,
          badges,
        },
      };
    },
};  

window.incomingHandler = async (data) => {
    try {
        const obj = window.Decoder.decode(data);
        if (obj.__typename in handlers) {
            let ev = handlers[obj.__typename](obj);
            if (!Array.isArray(ev)) {
                ev = [ev];
            }
            for (let msg of ev) {
                if (msg.type === "chat-message") {
                    return msg.event;
                } else if (msg.type === "chat-deleted") {
                    document.getElementById(msg.event.id).remove();
                }
            }
            
        } 
        return false;
    } catch {}
}

  function buildHtmlMessage(str, node) {
    switch (node.__typename) {
      case 'TextChatNode':
        return `${str}${node.text}`;
      case 'LinkChatNode':
        return `${str}${node.href}`;
      case 'MentionChatNode':
        return `${str}@${node.username}`;
      case 'EmojiChatNode':
        return `${str}${
          node.emoji.size28Src
            ? `<img src="${node.emoji.size28Src}" class="vstream-emoji" />`
            : `<span>${node.emoji.altText}</span>`
        }`;
      case 'ParagraphChatNode':
        return `${str}<p>${node.nodes.reduce(buildHtmlMessage, '')}</p>`;
      default:
        return str;
    }
  }