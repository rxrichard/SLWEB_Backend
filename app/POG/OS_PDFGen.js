const Helpers = use("Helpers");

exports.PDFGen = (Solicitacao, ID, Dados, verified) => {
  //Coloco a configuração das bebibas nesse array aqui em cima porque no meio do obj do pdf fica uma bagunça
  const configArray = [
    [
      { text: "Seleção", bold: true },
      { text: "Bebida", bold: true },
      { text: "Medida", bold: true },
      { text: "Valor", bold: true },
      { text: "Tipo", bold: true },
      { text: "Ativa", bold: true },
    ],
  ];

  const contenedores = [];

  Solicitacao.Contenedor.map((cont) =>
    contenedores.push([{ text: defineContenedor(cont) }])
  );

  const detalhes = [
    [{ text: "Modelo da Máquina: ", bold: true }, `${Solicitacao.Maquina}`],
  ];

  detalhes.push([
    { text: "Máquina Corporativa: ", bold: true },
    `${Solicitacao.Corporativa ? "Sim" : "Não"}`,
  ]);

  if (Solicitacao.Maquina !== "LEI SA") {
    detalhes.push([
      { text: "Inibir copos: ", bold: true },
      `${Solicitacao.InibirCopos === true ? "Sim" : "Não"}`,
    ]);
  }

  detalhes.push([
    { text: "Acompanha Gabinete: ", bold: true },
    `${Solicitacao.Gabinete ? "Sim" : "Não"}`,
  ]);
  detalhes.push([
    { text: "Abastecimento: ", bold: true },
    `${Solicitacao.Abastecimento}`,
  ]);
  detalhes.push([
    { text: "Sistema de Pagamento: ", bold: true },
    `${Solicitacao.Pagamento}`,
  ]);

  if (
    Solicitacao.Pagamento === "Validador" ||
    Solicitacao.Pagamento === "Cartão e Validador"
  ) {
    detalhes.push([
      { text: "Tipo de Validador: ", bold: true },
      `${Solicitacao.TipoValidador}`,
    ]);

    if (Solicitacao.TipoValidador === "Ficha") {
      detalhes.push([
        { text: "Fichas: ", bold: true },
        `${Solicitacao.Validador.toString()}`,
      ]);
    } else {
      detalhes.push([
        { text: "Moedas: ", bold: true },
        `${Solicitacao.Validador.toString()}`,
      ]);
    }
  }
  detalhes.push([
    { text: "Antena Externa: ", bold: true },
    `${Solicitacao.AntExt ? "Sim" : "Não"}`,
  ]);
  detalhes.push([
    { text: "Operadora do Chip da Telemetria: ", bold: true },
    `${Solicitacao.Chip}`,
  ]);

  Solicitacao.Configuracao.map((bebida) => {
    configArray.push([
      `${bebida.selecao}`,
      `${bebida.bebida.trim()}`,
      `${bebida.medida}ML`,
      `${Solicitacao.Pagamento === "Livre" ? "Livre" : bebida.valor}`,
      `${bebida.tipo}`,
      `${bebida.configura ? "Sim" : "Não"}`,
    ]);
  });

  Solicitacao.Telefone_Contato = Solicitacao.Telefone_Contato.replace(
    /()-/g,
    ""
  );

  //obj que vai virar pdf
  var docDefinition = {
    // watermark: Helpers.resourcesPath("logo/Exemplo logo pilao - Danfe.bmp"),
    content: [
      { text: "Order de Serviço", style: "header" },

      {
        image: Helpers.resourcesPath("logo/Exemplo logo pilao - Danfe.bmp"),
        width: 100,
        absolutePosition: { x: 460, y: 10 },
      },

      {
        text: `OS Nº ${`000000${ID}`.slice(-6)}`,
        bold: true,
        absolutePosition: { x: 461, y: 80 },
      },

      { text: "Solicitante", style: "subheader" },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*", "auto", "auto"],
          body: [
            [
              { text: "Franqueado: ", bold: true },
              `${verified.user_name}`,
              { text: "Filial: ", bold: true },
              `${verified.user_code}`,
            ],
          ],
        },
      },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*", "auto", "auto"],
          body: [
            [
              { text: "Grupo: ", bold: true },
              `${
                typeof Dados[0] != "undefined"
                  ? Dados[0].Razão_Social.trim()
                  : "Não encontrado"
              }`,
              { text: "CNPJ: ", bold: true },
              `${
                typeof Dados[0] != "undefined"
                  ? Dados[0].CNPJss.trim()
                  : "Não encontrado"
              }`,
            ],
          ],
        },
      },

      { text: "Destinatário", style: "subheader" },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*", "auto", "auto"],
          body: [
            [
              { text: "Cliente: ", bold: true },
              `${Solicitacao.Cliente_Destino}`,
              { text: "CNPJ: ", bold: true },
              `${Solicitacao.CNPJ_Destino.trim()}`,
            ],
          ],
        },
      },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*"],
          body: [
            [
              { text: "Endereço: ", bold: true },
              `${Solicitacao.Endereço_Entrega}`,
            ],
          ],
        },
      },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*", "auto", "*"],
          body: [
            [
              { text: "Data Solicitada: ", bold: true },
              `${new Date()
                .toISOString()
                .split("T")[0]
                .replace(/-/g, "/")
                .split("/")
                .reverse()
                .join("/")}`,
              { text: "Data Esperada: ", bold: true },
              `${new Date(Solicitacao.Data_Entrega_Desejada)
                .toISOString()
                .split("T")[0]
                .replace(/-/g, "/")
                .split("/")
                .reverse()
                .join("/")}`,
            ],
          ],
        },
      },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*", "auto", "*"],
          body: [
            [
              { text: "Contato: ", bold: true },
              `${Solicitacao.Contato}`,
              { text: "Tel: ", bold: true },
              `${[
                Solicitacao.Telefone_Contato.slice(
                  0,
                  Solicitacao.Telefone_Contato.length - 4
                ),
                "-",
                Solicitacao.Telefone_Contato.slice(-4),
              ].join("")}`,
            ],
          ],
        },
      },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*"],
          body: [
            [
              { text: "Email: ", bold: true },
              `${Solicitacao.Email_Acompanhamento}`,
            ],
          ],
        },
      },

      { text: "Configuração", style: "subheader" },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*", "auto", "auto", "auto", "auto"],
          body: configArray,
        },
      },

      { text: "Contenedores", style: "subheader" },

      {
        style: "tableExample",
        table: {
          widths: ["auto"],
          body: contenedores,
        },
      },

      { text: "Detalhes", style: "subheader", pageBreak: "before" },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*"],
          body: detalhes,
        },
      },

      { text: "Observações", style: "subheader" },

      {
        text:
          Solicitacao.Observacao !== "" ? Solicitacao.Observacao : "Ausente",
      },
    ],
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      tableExample: {
        margin: [0, 0, 0, 0],
      },
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: "black",
      },
    },
  };

  return docDefinition;
};

const defineContenedor = (cont) => {
  switch (cont) {
    case 1:
      return "Café";
    case 2:
      return "Leite";
    case 3:
      return "Cappuccino";
    case 4:
      return "Café c/ Leite";
    case 5:
      return "Achocolatado";
    case 6:
      return "Chá de Limão";
    default:
      return "Desconhecido";
  }
};
