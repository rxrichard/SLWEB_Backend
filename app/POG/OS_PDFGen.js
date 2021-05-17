const Helpers = use("Helpers");

exports.PDFGen = (config, Maq, ID, Dados, verified) => {

//Coloco a configuração das bebibas nesse array aqui em cima porque no meio do obj do pdf fica uma bagunça
  const configArray = [
    [
      { text: "Seleção", bold: true },
      { text: "Bebida", bold: true },
      { text: "Medida", bold: true },
      { text: "Valor", bold: true },
      { text: "Tipo", bold: true },
    ],
  ];

  const detalhes = [
    [{ text: "Modelo da Máquina: ", bold: true }, `${Maq.maquina}`],
  ]

  if (Maq.maquina !== "LEI SA") {
    detalhes.push(
      [{ text: "Inibir copos: ", bold: true },
      `${Maq.inibCopos ? "Sim" : "Não"}`]
    )
  }

  detalhes.push([{ text: "Acompanha Gabinete: ", bold: true }, `${Maq.gabinete}`])
  detalhes.push([{ text: "Abastecimento: ", bold: true }, `${Maq.abastecimento}`])
  detalhes.push([{ text: "Sistema de Pagamento: ", bold: true },`${Maq.sisPagamento}`])
  
  if(Maq.sisPagamento === "Validador" || Maq.sisPagamento === "Cartão e Validador") {
    detalhes.push(
      [{ text: "Tipo de Validador: ", bold: true }, `${Maq.TValidador}`]
    )

    if(Maq.TValidador === "Ficha"){
      detalhes.push([{ text: "Fichas: ", bold: true }, `${Maq.validador.toString()}`])
    }else{
      detalhes.push([{ text: "Moedas: ", bold: true }, `${Maq.validador.toString()}`])
    }
  } 
  detalhes.push([{ text: "Antena Externa: ", bold: true }, `${Maq.ExtAnt}`])
  detalhes.push([{ text: "Operadora do Chip da Telemetria: ", bold: true }, `${Maq.Chip}`])

  config.map((bebida) => {
    if (bebida.Bebida !== null) {
      configArray.push([
        `${bebida.Selecao}`,
        `${bebida.Bebida.trim()} ${
          bebida.Medida_Def ? bebida.Medida_Def.trim() : ""
        } `,
        `${bebida.Qtd_Def} ${bebida.Un.trim()}`,
        `${bebida.PrecoMaq}`,
        `${bebida.TProd}`,
      ]);
    }
  });

  Maq.Tel_Contato = Maq.Tel_Contato.replace(/()-/g, "")

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
              `${Maq.Cliente_Destino}`,
              { text: "CNPJ: ", bold: true },
              `${Maq.CNPJ_Destino.trim()}`,
            ],
          ],
        },
      },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*"],
          body: [[{ text: "Endereço: ", bold: true }, `${Maq.destino}`]],
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
              `${Maq.DtPretendida.split("T")[0]
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
              `${Maq.Contato}`,
              { text: "Tel: ", bold: true },
              `${[
                Maq.Tel_Contato.slice(0, Maq.Tel_Contato.length - 4),
                "-",
                Maq.Tel_Contato.slice(-4),
              ]
                .join("")}`,
            ],
          ],
        },
      },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*"],
          body: [[{ text: "Email: ", bold: true }, `${Maq.EmailA}`]],
        },
      },

      { text: "Configuração", style: "subheader" },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*", "auto", "auto", "auto"],
          body: configArray
        }
      },

      { text: "Detalhes", style: "subheader", pageBreak: 'before' },

      {
        style: "tableExample",
        table: {
          widths: ["auto", "*"],
          body: detalhes,
        },
      },

      { text: "Observações", style: "subheader" },
      
      { text: Maq.observacoes !== "" ? Maq.observacoes : "Ausente" },
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
}
