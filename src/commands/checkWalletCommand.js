import { uploadPDF } from "../helpers/uploadPDF.js";
import { whaleValidation } from "../helpers/utils.js";
import { transactionPairing } from "../main.js";
import { Whale } from "../models/models.js";

export async function checkWalletCommand(ctx, onProgress) {
  const { address, period } = ctx.scene.session;
  const { summary, transactions } = await transactionPairing(
    ctx,
    address,
    period,
    true,
    onProgress
  );

  const whale = await Whale.findOne({ where: { address: address } });

  const timestamp = new Date().getTime();

  if (period === 30 && whaleValidation(summary, transactions)) {
    if (whale) {
      await whale.update({
        winRate: summary.WinRateTotal,
        timestamp: timestamp,
      });
    } else {
      await Whale.create({
        address: address,
        winRate: summary["WinRateTotal"],
        timestamp: timestamp,
      });
    }
  } else if (whale && period === 30) {
    await whale.destroy();
  }

  await uploadPDF(ctx, summary, transactions);
}
