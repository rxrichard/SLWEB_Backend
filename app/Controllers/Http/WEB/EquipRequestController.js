"use strict";

const Database = use("Database");
const Helpers = use("Helpers");
const Mail = use("Mail");
const Env = use("Env");
const Drive = use("Drive");
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const { seeToken, dateCheck } = require("../../../POG/index");
const { PDFGen } = require("../../../POG/OS_PDFGen");

var fonts = {
  Roboto: {
    normal: Helpers.resourcesPath("fonts/OpenSans-Regular.ttf"),
    bold: Helpers.resourcesPath("fonts/OpenSans-Bold.ttf"),
    italics: Helpers.resourcesPath("fonts/OpenSans-RegularItalic.ttf"),
    bolditalics: Helpers.resourcesPath("fonts/OpenSans-BoldItalic.ttf"),
  },
};

const printer = new PdfPrinter(fonts);
class EquipRequestController {
  // retorna os possiveis endereços de entrega para as maquinas e os produtos disponiveis
  async See({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      //busca os endereços dos clientes para entrega
      const endereços = await Database.select(
        "Nome_Fantasia",
        "CNPJss",
        "Logradouro",
        "Número",
        "Complemento",
        "Bairro",
        "CEP",
        "Município",
        "UF"
      )
        .from("dbo.Cliente")
        .where({ GrpVen: verified.grpven })
        .orderBy("Nome_Fantasia");

      //busca tipos de máquina disponiveis para requisição
      const MaquinasDisponiveis = await Database.select("*")
        .from("dbo.OSConfigMaq")
        .where({
          Disponivel: 1,
        });

      //busca bebidas que o cliente pode incluir inicialmente na máquina
      const Bebidas = await Database.select("*")
        .from("dbo.OSBebidas")
        .where({
          Disp: 1,
        })
        .orderBy(
          "Bebida",
          "Cod",
          "Un",
          "Qtd",
          "Medida",
          "Disp",
          "Dominio",
          "Mistura",
          "Pronto"
        );

      //array auxiliar...
      const BebidasNovo = [];

      Bebidas.map((bebida) => {
        if (BebidasNovo.length === 0) {
          BebidasNovo.push(
            Object.assign({
              Cod: 0,
              Bebida: "DESATIVADO",
              Un: "ML",
              Qtd: ["0"],
              Medida: [],
              configura: false,
              Selecao: 0,
              PrecoMaq: 0,
              Mistura: 0,
              Pronto: 0,
              TProd: "DESATIVADO",
            })
          );
        }

        BebidasNovo.map((aux, i) => {
          if (aux.Bebida === bebida.Bebida) {
            aux.Qtd.push(bebida.Qtd);
            aux.Medida.push(bebida.Medida);
          } else if (i === BebidasNovo.length - 1) {
            BebidasNovo.push(
              Object.assign({
                Cod: bebida.Cod,
                Bebida: bebida.Bebida,
                Un: bebida.Un,
                Qtd: [bebida.Qtd],
                Medida: [bebida.Medida],
                configura: false,
                Selecao: 0,
                PrecoMaq: 0,
                Mistura: bebida.Mistura,
                Pronto: bebida.Pronto,
                TProd: null,
              })
            );
          }
        });
      });

      for (let i = 0; i < BebidasNovo.length; i++) {
        for (let j = 0; j < BebidasNovo[i].Medida.length; j++) {
          if (typeof BebidasNovo[i].Medida[j] == "string") {
            BebidasNovo[i].Medida.push(BebidasNovo[i].Medida[j]);
            BebidasNovo[i].Medida.splice(j, 1);
            BebidasNovo[i].Qtd.push(BebidasNovo[i].Qtd[j]);
            BebidasNovo[i].Qtd.splice(j, 1);
          }
        }
      }

      response
        .status(200)
        .send({ endereços, MaquinasDisponiveis, BebidasNovo });
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async Show({ request, response }) {
    const token = request.header("authorization");
    try {
      const verified = seeToken(token);
      const requisicao = await Database.select("*")
        .from("dbo.OSCtrl")
        .where({ GrpVen: verified.grpven })
        .orderBy("OSCId", "DESC");

      response.status(200).send(requisicao);
    } catch (err) {
      response.status(400).send();
    }
  }

  async SearchDefaultConfig({ request, response }) {
    const token = request.header("authorization");
    const { MaqId } = request.only(["MaqId"]);

    try {
      const verified = seeToken(token); //não uso o token aqui mas é melhor testar pela boa pratica

      const configPadrao = await Database.raw(
        "select B.Cod, M.MaqModelo, C.Selecao, B.Un,B.Bebida, B.Qtd as Qtd_Def, B.Medida as Medida_Def, IIF(C.Pront1Mist2 = 1, 'Pronto', 'Mistura') as TProd from dbo.OSMaqConfPadrao as C left join dbo.OSBebidas as B on C.CodBebida = B.Cod left join dbo.OSConfigMaq as M on M.MaqModId = C.MaqModId where M.MaqModId = ?",
        [MaqId]
      );

      const Bebidas = await Database.select("*")
        .from("dbo.OSBebidas")
        .where({
          Disp: 1,
        })
        .orderBy(
          "Bebida",
          "Cod",
          "Un",
          "Qtd",
          "Medida",
          "Disp",
          "Dominio",
          "Mistura",
          "Pronto"
        );

      //array auxiliar...
      const BebidasNovo = [];

      Bebidas.map((bebida) => {
        if (BebidasNovo.length === 0) {
          BebidasNovo.push(
            Object.assign({
              Cod: 0,
              Bebida: "DESATIVADO",
              Un: "ML",
              Qtd: ["0"],
              Medida: [],
              configura: false,
              Selecao: 0,
              PrecoMaq: 0,
              Mistura: 0,
              Pronto: 0,
              TProd: "DESATIVADO",
            })
          );
        }

        BebidasNovo.map((aux, i) => {
          if (aux.Bebida === bebida.Bebida) {
            aux.Qtd.push(bebida.Qtd);
            aux.Medida.push(bebida.Medida);
          } else if (i === BebidasNovo.length - 1) {
            BebidasNovo.push(
              Object.assign({
                Cod: bebida.Cod,
                Bebida: bebida.Bebida,
                Un: bebida.Un,
                Qtd: [bebida.Qtd],
                Medida: [bebida.Medida],
                configura: false,
                Selecao: 0,
                PrecoMaq: 0,
                Mistura: bebida.Mistura,
                Pronto: bebida.Pronto,
                TProd: null,
              })
            );
          }
        });
      });

      for (let i = 0; i < BebidasNovo.length; i++) {
        for (let j = 0; j < BebidasNovo[i].Medida.length; j++) {
          if (typeof BebidasNovo[i].Medida[j] == "string") {
            BebidasNovo[i].Medida.push(BebidasNovo[i].Medida[j]);
            BebidasNovo[i].Medida.splice(j, 1);
            BebidasNovo[i].Qtd.push(BebidasNovo[i].Qtd[j]);
            BebidasNovo[i].Qtd.splice(j, 1);
          }
        }
      }

      let configPadraoAux = [];

      configPadrao.map((config) => {
        BebidasNovo.map((bebida) => {
          if (config.Bebida === bebida.Bebida) {
            configPadraoAux.push(
              Object.assign(config, {
                Qtd: bebida.Qtd,
                Medida: bebida.Medida,
                Mistura: bebida.Mistura,
                Pronto: bebida.Pronto,
                PrecoMaq: 0,
                configura: true,
              })
            );
          }
        });
      });

      response.status(200).send({ configPadrao: configPadraoAux });
    } catch (err) {
      response.status(400).send();
    }
  }

  async All({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      if (
        verified.role === "Sistema" ||
        verified.role === "BackOffice" ||
        verified.role === "Técnica Pilão" ||
        verified.role === "Técnica Bianchi"
      ) {
        const requisicoes = await Database.select("*")
          .from("dbo.OSCtrl")
          .orderBy("OSCId", "DESC");

        response.status(200).send(requisicoes);
      } else {
        throw Error;
      }
    } catch (err) {
      response.status(400).send("token não possui privilégios");
    }
  }

  async Store({ request, response }) {
    const token = request.header("authorization");
    const { Maq, config } = request.only(["Maq", "config"]);
    const path = Helpers.publicPath(`/OS`);

    const verified = seeToken(token);

    //buscando ultima id de OS
    const OSCID = await Database.select("OSCId")
      .from("dbo.OSCtrl")
      .orderBy("OSCId", "DESC");

    let ID = 0;

    if (OSCID.length > 0) {
      ID = parseFloat(OSCID[0].OSCId) + 1;
    } else {
      ID = 1;
    }

    //crio variavel com o endereço completo do PDF
    const PathWithName = `${path}/ORDEM-${
      verified.grpven
    }-${`000000${ID}`.slice(-6)}.pdf`;

    const Dados = await Database.raw(
      "select C.CNPJss, C.Razão_Social from dbo.SIGAMAT as S inner join dbo.Cliente as C on C.CNPJ = S.M0_CGC where C.GrpVen = ?",
      [verified.grpven]
    );

    // Salva as informações cabeçalho da OS
    await Database.insert({
      OSTId: Maq.maquina === "" ? 2 : 1,
      OSCStatus: "Ativo",
      GrpVen: verified.grpven,
      OSCDtSolicita: dateCheck(),
      OSCDtPretendida: Maq.DtPretendida,
      OSCDtAceite: null,
      OSCTecDtVisualizada: null,
      OSCTecDtValidação: null,
      OSCTecAceite: null,
      OSCTecMotivo: null,
      OSCTecDtPrevisao: null,
      OSCComDtVisualizada: null,
      OSCComDtValidação: null,
      OSCComAceite: null,
      OSCComMotivo: null,
      OSCExpDtVisualizada: null,
      OSCExpDtPrevisao: null,
      OSCnpjDest: Maq.CNPJ_Destino,
      OSCDestino: Maq.destino,
      OSCPDF: `ORDEM-${verified.grpven}-${`000000${ID}`.slice(-6)}.pdf`,
      OSCEmail: Maq.EmailA,
      OSCTelCont: Maq.Tel_Contato,
      OSCcontato: Maq.Contato,
    }).into("dbo.OSCtrl");

    //Salva as configurações de bebida da máquina
    config.map(async (bebida) => {
      if (bebida.Bebida) {
        await Database.insert({
          OSCId: ID,
          Selecao: bebida.Selecao,
          BebidaId: bebida.Cod,
          UnMedida: bebida.Qtd_Def,
          GrpVen: verified.grpven,
          PrecoMaq: bebida.PrecoMaq,
          TProduto: bebida.TProd,
        }).into("dbo.OSCtrlDet");
      }
    });

    //salva as especificações da máquina
    await Database.insert({
      OSCId: ID,
      GrpVen: verified.grpven,
      MaqId: Maq.maqid,
      THidrico: Maq.abastecimento,
      InibCopos: Maq.inibCopos,
      Gabinete: Maq.gabinete,
      SisPag: Maq.sisPagamento,
      TComunic: Maq.Chip,
      Antena: Maq.ExtAnt,
      ValidadorCond: Maq.TValidador,
      ValidadorVal: Maq.validador.toString(),
      OSObs: Maq.observacoes,
    }).into("dbo.OSCtrlSpec");

    const PDFModel = PDFGen(config, Maq, ID, Dados, verified)

    var pdfDoc = printer.createPdfKitDocument(PDFModel);
    pdfDoc.pipe(fs.createWriteStream(PathWithName));
    pdfDoc.end();

    //enviar email de nova solicitação
    await Mail.send(
      "emails.newOS",
      { verified, ID, Frontend: Env.get("CLIENT_URL") },
      (message) => {
        message
          .to(Maq.EmailA)
          .cc([Env.get("EMAIL_COMERCIAL_1"), Env.get("EMAIL_COMERCIAL_2")])
          .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
          .subject("Nova ordem de serviço")
          .attach(PathWithName);
      }
    );

    const file = await Drive.get(`${PathWithName}`);
    Drive.put(
      `\\\\192.168.1.250\\dados\\Franquia\\SLWEB\\OS\\ORDEM-${
        verified.grpven
      }-${`000000${ID}`.slice(-6)}.pdf`,
      file
    );

    response.status(201).send("ok");
  }

  async Destroy({ request, response }) {
    const token = request.header("authorization");
    const { ID } = request.only(["ID"]);
    const path = Helpers.publicPath(`/OS`);

    try {
      const verified = seeToken(token);
      const PathWithName = `${path}/ORDEM-${
        verified.grpven
      }-${`000000${ID}`.slice(-6)}.pdf`;

      // const orderDet = await Database.select("OSCEmail")
      //   .from("dbo.OSCtrl")
      //   .where({
      //     OSCId: ID,
      //     GrpVen: verified.grpven,
      //   });

      const updatedRows = await Database.table("dbo.OSCtrl")
        .where({
          OSCId: ID,
          GrpVen: verified.grpven,
          OSCStatus: "Ativo",
        })
        .update({
          OSCStatus: "Cancelado",
          OSCDtAceite: dateCheck(),
        });

      if (updatedRows.length < 1) throw Error;

      Mail.send("emails.cancelOS", { verified, ID }, (message) => {
        message
          .to(Env.get("EMAIL_SUPORTE")) //não testei se esse argumento funciona
          .cc([
            Env.get("EMAIL_COMERCIAL_1"),
            Env.get("EMAIL_COMERCIAL_2"),
            Env.get("EMAIL_TECNICA_1"),
            Env.get("EMAIL_TECNICA_2"),
            Env.get("EMAIL_TECNICA_3"),
          ])
          .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
          .subject("Cancelamento de OS")
          .attach(PathWithName);
      });

      response.status(201).send('ok');
    } catch (err) {
      response.status(400).send();
    }
  }

  async RetriveOS({ request, response }) {
    const token = request.header("authorization");
    const { OSID } = request.only(["OSID"]);
    let pdfName = [];

    try {
      const verified = seeToken(token);

      if (
        verified.role === "Sistema" ||
        verified.role === "BackOffice" ||
        verified.role === "Técnica Pilão" ||
        verified.role === "Técnica Bianchi"
      ) {
        pdfName = await Database.select("OSCPDF").from("dbo.OSCtrl").where({
          OSCId: OSID,
        });
      } else {
        pdfName = await Database.select("OSCPDF").from("dbo.OSCtrl").where({
          GrpVen: verified.grpven,
          OSCId: OSID,
        });
      }

      response.attachment(`${Helpers.publicPath(`/OS`)}/${pdfName[0].OSCPDF}`);
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async ViewCheck({ request, response }) {
    const token = request.header("authorization");
    const { ID } = request.only(["ID"]);

    try {
      const verified = seeToken(token);

      switch (verified.role) {
        //Comercial
        case "BackOffice":
          const ComercialCheck = await Database.select("OSCComDtVisualizada")
            .from("dbo.OSCtrl")
            .where({
              OSCId: ID,
            });

          if (ComercialCheck[0].OSCComDtVisualizada === null) {
            await Database.table("dbo.OSCtrl")
              .where({
                OSCId: ID,
              })
              .update({
                OSCComDtVisualizada: dateCheck(),
              });
            response.status(200).send("ok");
          } else {
            response.status(200).send("nok");
          }

          break;

        //Expedição
        case "Técnica Pilão":
          const ExpediçãoCheck = await Database.select("OSCExpDtVisualizada")
            .from("dbo.OSCtrl")
            .where({
              OSCId: ID,
            });

          if (ExpediçãoCheck[0].OSCExpDtVisualizada === null) {
            await Database.table("dbo.OSCtrl")
              .where({
                OSCId: ID,
              })
              .update({
                OSCExpDtVisualizada: dateCheck(),
              });
            response.status(200).send("ok");
          } else {
            response.status(200).send("nok");
          }
          break;

        //Fabrica de maquinas Bianchi
        case "Técnica Bianchi":
          const TecnicaCheck = await Database.select("OSCTecDtVisualizada")
            .from("dbo.OSCtrl")
            .where({
              OSCId: ID,
            });

          if (TecnicaCheck[0].OSCTecDtVisualizada === null) {
            await Database.table("dbo.OSCtrl")
              .where({
                OSCId: ID,
              })
              .update({
                OSCTecDtVisualizada: dateCheck(),
              });
            response.status(200).send("ok");
          } else {
            response.status(200).send("nok");
          }
          break;

        case "Sistema":
          response.status(200).send("ok");
          break;

        default:
          response.status(200).send("nok");
          break;
      }
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async ValidateOS({ request, response }) {
    const token = request.header("authorization");
    const { OSID, action, reject, prev } = request.only([
      "OSID",
      "action",
      "reject",
      "prev",
    ]);
    let dados = [];

    try {
      const verified = seeToken(token);

      switch (verified.role) {
        case "BackOffice":
          await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCComDtValidação: dateCheck(),
              OSCComAceite: action === "accept" ? true : false,
              OSCComMotivo: reject,
              OSCStatus: action === "accept" ? "Ativo" : "Cancelado",
            });

          dados = await Database.select("*")
            .from("dbo.OSCtrl")
            .where({ OSCId: OSID });

          await Mail.send(
            "emails.ComValidaOS",
            {
              ID: OSID,
              Dt: dados[0].OSCDtPretendida,
              Frontend: Env.get("CLIENT_URL"),
            },
            (message) => {
              message
                .to(Env.get("EMAIL_SUPORTE"))
                .cc([
                  Env.get("EMAIL_TECNICA_1"),
                  Env.get("EMAIL_TECNICA_2"),
                  Env.get("EMAIL_TECNICA_3"),
                ])
                .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
                .subject("OS Validada pela Pilão")
                .attach(Helpers.publicPath(`OS/${dados[0].OSCPDF}`), {
                  filename: dados[0].OSCPDF,
                });
            }
          );

          response.status(200).send();
          break;
        case "Técnica Pilão":
          await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCExpDtPrevisao: prev,
            });

          response.status(200).send();
          break;
        case "Técnica Bianchi":
          await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCTecDtValidação: dateCheck(),
              OSCTecAceite: action === "accept" ? true : false,
              OSCTecMotivo: reject,
              OSCTecDtPrevisao: prev,
              OSCStatus: action === "accept" ? "Ativo" : "Cancelado",
            });

          dados = await Database.select("*")
            .from("dbo.OSCtrl")
            .where({ OSCId: OSID });

          await Mail.send(
            "emails.TecValidaOS",
            {
              ID: OSID,
              DtC: dados[0].OSCDtPretendida,
              DtT: prev,
              Frontend: Env.get("CLIENT_URL"),
            },
            (message) => {
              message
                .to(Env.get("EMAIL_SUPORTE"))
                .cc([
                  Env.get("EMAIL_EXPEDICAO_1"),
                  Env.get("EMAIL_EXPEDICAO_2"),
                ])
                .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
                .subject("OS Validada pela Técnica")
                .attach(Helpers.publicPath(`OS/${dados[0].OSCPDF}`), {
                  filename: dados[0].OSCPDF,
                });
            }
          );

          response.status(200).send();
          break;
        case "Franquia":
          await Database.table("dbo.OSCtrl")
            .where({
              GrpVen: verified.grpven,
              OSCId: OSID,
              OSCStatus: "Ativo",
            })
            .update({
              OSCStatus: "Concluido",
              OSCDtAceite: dateCheck(),
            });
          response.status(200).send();
          break;
      }
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async SistemOptions({ request, response }) {
    const token = request.header("authorization");
    const { action, OSID } = request.only(["action", "OSID"]);

    try {
      const verified = seeToken(token);

      if (verified.role !== "Sistema") throw Error;

      switch (action) {
        case "Cancelar": //cancelar OS
          const S = await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCStatus: "Cancelado",
            });
          if (S < 1) throw Error;

          response.status(200).send();

        case "RT": //retirar técnica
          const B = await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCTecDtValidação: null,
              OSCTecAceite: null,
              OSCTecMotivo: null,
              OSCTecDtPrevisao: null,
            });
          if (B < 1) throw Error;

          response.status(200).send();
        case "RC": //retirar comercial
          const C = await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCComDtValidação: null,
              OSCComAceite: null,
              OSCComMotivo: null,
            });
          if (C < 1) throw Error;

          response.status(200).send();

        case "RE": //retirar expedição
          const E = await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCExpDtPrevisao: null,
            });
          if (E < 1) throw Error;

          response.status(200).send();
      }
    } catch (err) {
      response.status(400).send();
    }
  }

  isNull(value) {
    if (
      value === "DESATIVADO" ||
      value === "NULL" ||
      value === "DESATIVADA" ||
      value === "Preencher"
    ) {
      return null;
    } else {
      return value;
    }
  }
}

module.exports = EquipRequestController;
