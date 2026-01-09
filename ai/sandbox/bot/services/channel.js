export const ChannelService = {
  async send(bot, channelId, message) {
    return bot.telegram.sendMessage(channelId, message);
  }
};