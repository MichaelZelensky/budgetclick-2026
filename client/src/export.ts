import { zipSync, strToU8 } from "fflate";
import { dbGetAttachment } from "@/repository/attachment";
import { dbGetAccounts } from "@/repository/account";
import { dbGetCategories } from "@/repository/category";
import { dbGetContractors } from "@/repository/contractor";
import { dbGetRates } from "@/repository/rates";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { getManifest } from "@/manifest";
import { loadAllChunks } from "@/sync";
import { getFile } from "@/storage";
import { decodeBlob, decodeData } from "@/utils/data";

export const exportData = async (includeAttachments: boolean): Promise<void> => {
  const loadingId = setLoadingOn();
  try {
    const manifest = getManifest();
    const [accounts, categories, contractors, rates, chunks] = await Promise.all([
      dbGetAccounts(),
      dbGetCategories(),
      dbGetContractors(),
      dbGetRates(),
      loadAllChunks(manifest),
    ]);
    const transactions = Object.values(chunks)
      .flatMap(x => x.transactions)
      .filter(x => !x.isDeleted);
    const attachments: Record<string, { name: string; type: string }> = {};
    const files: Record<string, Uint8Array> = {};

    if (includeAttachments) {
      const attachmentIds = [
        ...new Set(
          transactions.flatMap(transaction =>
            transaction.attachments
              .filter(x => !x.isDeleted)
              .map(x => x.id),
          ),
        ),
      ];

      for (const id of attachmentIds) {
        const cachedAttachment = await dbGetAttachment(id);
        const attachment =
          cachedAttachment ??
          decodeData<{
            name: string;
            type: string;
            data: string;
          }>(await getFile(id));

        attachments[id] = {
          name: attachment.name,
          type: attachment.type,
        };
        files[`attachments/${id}-${attachment.name}`] = new Uint8Array(
          decodeBlob(attachment.data),
        );
      }
    }

    const data = {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      accounts: accounts?.accounts ?? [],
      categories: categories?.categories ?? [],
      contractors: contractors?.contractors ?? [],
      rates: rates?.rates ?? [],
      transactions,
      attachments,
    };

    files["data.json"] = strToU8(JSON.stringify(data));

    const blob = new Blob([zipSync(files)], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budgetclick-export-${new Date().toISOString().slice(0, 10)}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    setLoadingOff(loadingId);
  }
};