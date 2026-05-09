export const syncUserCredits = (remainingCredits) => {
  if (remainingCredits === null || remainingCredits === undefined) return;
  
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    const user = JSON.parse(savedUser);
    user.credits = remainingCredits;
    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("creditsUpdated", { detail: remainingCredits }));
  }
};
