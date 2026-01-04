export const MessageService = {
  formatUser(user) {
    return user?.username || user?.first_name || "Unknown User";
  }
};