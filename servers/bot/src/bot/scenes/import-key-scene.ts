import bs58 from "bs58";
import { Markup, Scenes } from "telegraf";
import { web3 } from "@coral-xyz/anchor";

import { encrypt } from "../../core";
import { readFileSync } from "../utils";
import { db, secretKey } from "../../instances";
import {
  loadWallet,
  updateWalletByUserAndId,
} from "../../controllers/wallets.controller";

export const importKeySceneId = "import-key-scene";

export const importKeyScene = new Scenes.WizardScene(
  importKeySceneId,
  async (context) => {
    await context.replyWithMarkdownV2(
      readFileSync("locale/en/wallet/import-key.md", "utf-8"),
      Markup.forceReply()
    );

    return context.wizard.next();
  },
  async (context) => {
    const message = context.message;
    if (message && "text" in message) {
      const text = message.text.replace(/\s/g, "");
      let keypair;

      try {
        keypair = web3.Keypair.fromSeed(Buffer.from(text));
      } catch {
        try {
          keypair = web3.Keypair.fromSecretKey(bs58.decode(text));
        } catch {
          try {
            keypair = web3.Keypair.fromSecretKey(Buffer.from(JSON.parse(text)));
          } catch {}
        }
      }

      if (keypair) {
        const [wallet] = await updateWalletByUserAndId(
          db,
          context.user.id,
          context.user.wallet.id,
          { key: encrypt(secretKey, keypair.secretKey.toBase64()) }
        );

        context.user.wallet = wallet;
        context.wallet = loadWallet(wallet);

        await context.replyWithMarkdownV2(
          readFileSync("locale/en/wallet/wallet-import-successful.md", "utf-8")
        );

        return context.scene.leave();
      }

      await context.replyWithMarkdownV2(
        readFileSync("locale/en/wallet/wallet-import-failed.md", "utf-8")
      );

      return context.scene.leave();
    }
  }
);
