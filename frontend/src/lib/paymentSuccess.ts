import { PaymentAction } from "@/lib/payments";

export interface PaymentCelebrationCopy {
  emoji: string;
  title: string;
  subtitle: string;
  accent: "cyan" | "green" | "violet";
}

export function getPaymentCelebrationCopy(
  action: PaymentAction,
  username?: string,
  quantity = 1
): PaymentCelebrationCopy {
  const name = username?.trim();
  const you = name ? `, ${name}` : "";
  const q = Math.max(1, quantity);

  switch (action) {
    case "water":
      return {
        emoji: "💧",
        title: q === 1 ? "You watered the organism!" : `You added ${q} waterings!`,
        subtitle:
          q === 1
            ? `Thank you${you}! Your care flows through Gloobloom — everyone can see you in the live feed.`
            : `Thank you${you}! ${q} drops of care flow through Gloobloom — your name shines in the live feed.`,
        accent: "cyan",
      };
    case "leaf":
      return {
        emoji: "🍃",
        title: q === 1 ? "Your name is on a leaf!" : `${q} leaves now carry your name!`,
        subtitle:
          q === 1
            ? `Beautiful${you}! Your mark will grow with the plant for all visitors to discover.`
            : `Beautiful${you}! ${q} leaves across the organism now show your name for everyone to discover.`,
        accent: "green",
      };
    case "comment":
      return {
        emoji: "💬",
        title: "Comment posted!",
        subtitle: `Thanks${you}! Your words are now part of the living story.`,
        accent: "violet",
      };
    default:
      return {
        emoji: "✨",
        title: "Payment complete!",
        subtitle: "Thank you for supporting Gloobloom.",
        accent: "cyan",
      };
  }
}
