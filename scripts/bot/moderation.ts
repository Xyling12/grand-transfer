import { BotDeps } from './types';

// --- Moderation Constants ---
const BANNED_WORDS = ['хуй', 'пизда', 'ебать', 'сука', 'блядь', 'блять', 'пидор', 'гандон', 'шлюха'];
const POLITICAL_WORDS = ['путин', 'зеленский', 'навальный', 'байден', 'сво', 'война', 'украина', 'россия', 'политика', 'митинг', 'выборы'];
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)|(t\.me\/[^\s]+)/gi;

export function registerModerationHandlers(deps: BotDeps) {
    const { bot } = deps;

    // Chat Group Moderation Listener
    bot.on('message', async (ctx, next) => {
        // Only moderate messages in group chats (supergroups or regular groups)
        if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {

            // 1. System messages cleanup (Join/Leave/Pin)
            if ('new_chat_members' in ctx.message || 'left_chat_member' in ctx.message || 'pinned_message' in ctx.message) {
                try {
                    await ctx.deleteMessage();
                } catch (err) { }
                return; // Stop processing this message
            }

            const messageText = (ctx.message as any)?.text || (ctx.message as any)?.caption || '';

            if (!messageText) return next();

            const lowerText = messageText.toLowerCase();
            let shouldDelete = false;
            let reason = '';

            // 1. Check for URLs / Links
            URL_REGEX.lastIndex = 0; // Reset stateful regex before each test
            if (URL_REGEX.test(messageText)) {
                shouldDelete = true;
                reason = 'Ссылки запрещены';
            }

            // 2. Check for Profanity
            if (!shouldDelete && BANNED_WORDS.some(word => lowerText.includes(word))) {
                shouldDelete = true;
                reason = 'Ненормативная лексика';
            }

            // 3. Check for Political keywords
            if (!shouldDelete && POLITICAL_WORDS.some(word => lowerText.includes(word))) {
                shouldDelete = true;
                reason = 'Политические обсуждения правилами запрещены';
            }

            if (shouldDelete) {
                try {
                    await ctx.deleteMessage();
                    // Optionally warn the user silently or briefly
                    const warning = await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name}, ваше сообщение удалено. Причина: ${reason}.`);
                    // Delete the warning after 5 seconds to keep the chat clean
                    setTimeout(() => {
                        ctx.telegram.deleteMessage(ctx.chat.id, warning.message_id).catch(() => { });
                    }, 5000);
                } catch (err) {
                    console.error('Failed to moderate / delete message:', err);
                }
                // Stop processing this message further
                return;
            }
        }

        // Continue processing if no violation or not a group chat
        return next();
    });
}
