import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import { fieldMappings, summaryMappings } from "./constants.js";
import { toFixedNumber } from "./utils.js";

pdfMake.addVirtualFileSystem(pdfFonts);

pdfMake.fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

const getNestedValue = (obj, path) =>
  path.split(".").reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : null),
    obj
  );

const summaryValue = (summary, mapping) => {
  const value = toFixedNumber(summary[mapping.path]);
  return `${mapping.type === "$" ? "$" : ""}${value}${
    mapping.type === "%" ? "%" : ""
  }`;
};

const createSummaryRows = (summary) => {
  const rows = [];

  for (let index = 0; index < summaryMappings.length; index += 2) {
    const mappings = summaryMappings.slice(index, index + 2);
    const row = mappings.flatMap((mapping) => [
      { text: mapping.label, style: "summaryLabel" },
      { text: summaryValue(summary, mapping), style: "summaryValue" },
    ]);

    while (row.length < 4) {
      row.push({ text: "", style: "summaryValue" });
    }
    rows.push(row);
  }

  return rows;
};

const transactionCell = (transaction, field) => {
  const rawValue = getNestedValue(transaction, field.path);
  const value = field.formatter ? field.formatter(rawValue) : rawValue;
  const displayValue = value === null || value === undefined ? "-" : value;
  const isDeltaField =
    field.path.includes("delta") && field.path !== "delta.accumPrice";
  const isDeltaTokens = field.path === "delta.deltaTokens";
  const isDeltaPercentage = field.path === "delta.deltaPercentage";
  let fillColor;

  if (isDeltaField) {
    if (isDeltaTokens && value === 0) {
      fillColor = "#caedbb";
    } else if (!isDeltaTokens && value > 0) {
      fillColor = "#caedbb";
    } else if (isDeltaPercentage && value === -100) {
      fillColor = "#bf2222";
    } else {
      fillColor = "#fc9090";
    }
  }

  return {
    text: `${displayValue}${isDeltaPercentage ? "%" : ""}`,
    fontSize: 7,
    alignment: field.path === "ticker" ? "left" : "right",
    fillColor,
    margin: [1, 2, 1, 2],
  };
};

export const createWalletReportBuffer = ({
  summary,
  transactions,
  address,
  period,
}) => {
  const documentDefinition = {
    info: {
      title: `Отчёт по кошельку ${address}`,
      subject: `Торговые операции за ${period} дней`,
    },
    content: [
      {
        text: `Адрес кошелька: ${address}\nПериод: ${period} дней`,
        style: "addressRow",
      },
      {
        style: "tableSummary",
        table: {
          widths: ["auto", "*", "auto", "*"],
          body: createSummaryRows(summary),
        },
        layout: "lightHorizontalLines",
      },
      {
        table: {
          headerRows: 1,
          widths: [
            45, 70, 70, 60, 60, 60, 75, 75, 65, 55, 45, 45, 95, 70, 70,
            70,
          ],
          body: [
            fieldMappings.map((field) => ({
              text: field.label,
              fontSize: 7,
              bold: true,
              alignment: "center",
              fillColor: "#e8edf3",
              margin: [1, 3, 1, 3],
            })),
            ...transactions.map((transaction) =>
              fieldMappings.map((field) => transactionCell(transaction, field))
            ),
          ],
        },
        layout: {
          hLineColor: () => "#c8cdd3",
          vLineColor: () => "#c8cdd3",
          paddingLeft: () => 2,
          paddingRight: () => 2,
        },
      },
    ],
    footer: (currentPage, pageCount) => ({
      text: `Страница ${currentPage} из ${pageCount}`,
      alignment: "center",
      fontSize: 8,
      color: "#666666",
      margin: [0, 8, 0, 0],
    }),
    styles: {
      tableSummary: {
        margin: [0, 12, 0, 14],
      },
      summaryLabel: {
        bold: true,
        fontSize: 9,
        margin: [3, 3, 3, 3],
      },
      summaryValue: {
        fontSize: 9,
        alignment: "right",
        margin: [3, 3, 3, 3],
      },
      addressRow: {
        fontSize: 11,
        bold: true,
      },
    },
    defaultStyle: {
      font: "Roboto",
    },
    pageMargins: [18, 18, 18, 24],
    pageOrientation: "landscape",
    pageSize: "A3",
  };

  return new Promise((resolve) => {
    pdfMake.createPdf(documentDefinition).getBuffer(resolve);
  });
};
