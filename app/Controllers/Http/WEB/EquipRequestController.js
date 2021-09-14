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
const moment = require("moment");
moment.locale("pt-br");

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

      //prazo minimo para recebimento das máquinas
      const MinDDL = await Database.select("ParamVlr")
        .from("dbo.Parametros")
        .where({
          ParamId: "SolMaqDDL",
        });

      //textos de ajuda
      const Ajudas = await Database.raw(
        "select * from dbo.Parametros where ParamId like 'ajuda%' order by ParamVlr ASC"
      );

      const newAjudas = [];

      //formato as ajudas pra serem mais "maleaveis" pelo front-end
      Ajudas.map((ajuda) => {
        newAjudas.push({
          name: ajuda.ParamId.replace("ajuda", ""),
          text: ajuda.ParamTxt,
          section: ajuda.ParamVlr,
        });
      });

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
          "Qtd",
          "Cod",
          "Un",
          "Medida",
          "Disp",
          "Dominio",
          "Mistura",
          "Pronto"
        );

      //array auxiliar...
      const BebidasNovo = [];
      let templateBebida = null;

      //junta as bebidas iguais no mesmo objeto
      Bebidas.map((bebida) => {
        templateBebida = {
          Cod: bebida.Cod,
          Bebida: bebida.Bebida,
          Un: bebida.Un,
          Qtd: [bebida.Qtd],
          Medida: [bebida.Medida],
          Mistura: bebida.Mistura,
          Pronto: bebida.Pronto,
          ContPronto: bebida.ContPronto,
          ContMist: bebida.ContMist,
          PrecoMaq: 0,
          Selecao: 0,
          configura: false,
          TProd: null,
        };
        if (BebidasNovo.length === 0) {
          BebidasNovo.push(Object.assign(templateBebida));
        } else {
          BebidasNovo.map((aux, i) => {
            if (aux.Bebida === bebida.Bebida) {
              aux.Qtd.push(bebida.Qtd);
              aux.Medida.push(bebida.Medida);
            } else if (i === BebidasNovo.length - 1) {
              BebidasNovo.push(Object.assign(templateBebida));
            }
          });
        }
      });

      //organiza medidas em order crescente
      for (let i = 0; i < BebidasNovo.length; i++) {
        for (let j = 0; j < BebidasNovo[i].Qtd.length; j++) {
          if (BebidasNovo[i].Qtd[j] > BebidasNovo[i].Qtd[j + 1]) {
            BebidasNovo[i].Medida.push(BebidasNovo[i].Medida[j]);
            BebidasNovo[i].Medida.splice(j, 1);
            BebidasNovo[i].Qtd.push(BebidasNovo[i].Qtd[j]);
            BebidasNovo[i].Qtd.splice(j, 1);
          }
        }
      }

      response.status(200).send({
        endereços,
        MaquinasDisponiveis,
        BebidasNovo,
        MinDDL: MinDDL[0].ParamVlr,
        newAjudas,
      });
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

  async SearchDefaultConfig({ request, response, params }) {
    const token = request.header("authorization");
    const MaqId = params.id;

    try {
      const verified = seeToken(token); //não uso o token aqui mas é melhor testar pela boa pratica

      const configPadrao = await Database.raw(
        "select B.Cod, C.MaqConfigId, M.MaqModelo, C.MaqConfigNome , C.Selecao, B.Un,B.Bebida, B.Qtd as Qtd_Def, B.Medida as Medida_Def, IIF(C.Pront1Mist2 = 1, 'Pronto', 'Mistura') as TProd, IIF(C.Pront1Mist2 = 1, B.ContPronto, B.ContMist) as Contenedor from dbo.OSMaqConfPadrao as C left join dbo.OSBebidas as B on C.CodBebida = B.Cod left join dbo.OSConfigMaq as M on M.MaqModId = C.MaqModId where M.MaqModId = ?",
        [MaqId]
      );

      let configPadraoNovo = [];

      //formato/separo as configurações
      configPadrao.map((bebida) => {
        if (typeof configPadraoNovo[bebida.MaqConfigId] == "undefined") {
          configPadraoNovo[bebida.MaqConfigId] = [];
          configPadraoNovo[bebida.MaqConfigId].push(bebida);
        } else {
          configPadraoNovo[bebida.MaqConfigId].push(bebida);
        }
        return;
      });

      //removo qualquer indice do array que seja null
      let filtered = configPadraoNovo.filter(function (el) {
        return el != null;
      });

      response.status(200).send(filtered);
    } catch (err) {
      response.status(400).send(err);
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
        verified.role === "Técnica Bianchi" ||
        verified.role === "Expedição"
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
    const { Solicitacao } = request.only(["Solicitacao"]);
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
      OSTId: Solicitacao.Maquina === "" ? 2 : 1,
      OSCStatus: "Ativo",
      GrpVen: verified.grpven,
      OSCDtSolicita: moment().subtract(3, "hours").toDate(),
      OSCDtPretendida: Solicitacao.Data_Entrega_Desejada,
      OSCDtFechamento: null,
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
      OSCnpjDest: Solicitacao.CNPJ_Destino,
      OSCDestino: Solicitacao.Endereço_Entrega,
      OSCPDF: `ORDEM-${verified.grpven}-${`000000${ID}`.slice(-6)}.pdf`,
      OSCEmail: Solicitacao.Email_Acompanhamento,
      OSCTelCont: Solicitacao.Telefone_Contato,
      OSCcontato: Solicitacao.Contato,
    }).into("dbo.OSCtrl");

    //Salva as configurações de bebida da máquina
    await Solicitacao.Configuracao.map(async (bebida) => {
      await Database.insert({
        OSCId: ID,
        Selecao: bebida.selecao,
        BebidaId: bebida.id,
        UnMedida: bebida.medida,
        GrpVen: verified.grpven,
        PrecoMaq: bebida.valor,
        PrecoRep: bebida.valor2,
        TProduto: bebida.tipo,
        Ativa: bebida.configura,
      }).into("dbo.OSCtrlDet");
    });

    //salva as especificações da máquina
    await Database.insert({
      OSCId: ID,
      GrpVen: verified.grpven,
      MaqId: Solicitacao.MaquinaId,
      THidrico: Solicitacao.Abastecimento,
      InibCopos: Solicitacao.InibirCopos,
      Gabinete:
        typeof Solicitacao.Gabinete == "undefined" ||
        Solicitacao.Gabinete === ""
          ? false
          : Solicitacao.Gabinete,
      SisPag: Solicitacao.Pagamento,
      TComunic: Solicitacao.Chip,
      Antena: Solicitacao.AntExt,
      ValidadorCond: Solicitacao.TipoValidador,
      ValidadorVal: Solicitacao.Validador.toString(),
      MaqCorp: Solicitacao.Corporativa,
      OSObs: Solicitacao.Observacao,
    }).into("dbo.OSCtrlSpec");

    const PDFModel = PDFGen(Solicitacao, ID, Dados, verified);

    var pdfDoc = printer.createPdfKitDocument(PDFModel);
    pdfDoc.pipe(fs.createWriteStream(PathWithName));
    pdfDoc.end();

    //enviar email de nova solicitação
    Mail.send(
      "emails.OSnew",
      { verified, ID, Frontend: Env.get("CLIENT_URL") },
      (message) => {
        message
          .to(Solicitacao.Email_Acompanhamento)
          .cc([Env.get("EMAIL_SUPORTE"), Env.get("EMAIL_COMERCIAL_1"), Env.get("EMAIL_COMERCIAL_2")])
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
        verified.role === "Técnica Bianchi" ||
        verified.role === "Expedição"
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
        case "BackOffice":
          await Database.raw(
            "IF (select OSCComDtVisualizada from dbo.OSCtrl where OSCId = ?) IS NULL UPDATE dbo.OSCtrl SET OSCComDtVisualizada = CONVERT(datetime, ?, 121) where OSCId = ?",
            [ID, moment().subtract(3, "hours").toDate(), ID]
          );

          break;

        case "Técnica Pilão" || "Técnica Bianchi":
          await Database.raw(
            "IF (select OSCTecDtVisualizada from dbo.OSCtrl where OSCId = ?) IS NULL UPDATE dbo.OSCtrl SET OSCTecDtVisualizada = CONVERT(datetime, ?, 121) where OSCId = ?",
            [ID, moment().subtract(3, "hours").toDate(), ID]
          );
          break;

        case "Expedição":
          await Database.raw(
            "IF (select OSCExpDtVisualizada from dbo.OSCtrl where OSCId = ?) IS NULL UPDATE dbo.OSCtrl SET OSCExpDtVisualizada = CONVERT(datetime, ?, 121) where OSCId = ?",
            [ID, moment().subtract(3, "hours").toDate(), ID]
          );
          break;

        default:
          response.status(200).send("ok");
          break;
      }
      response.status(200).send("ok");
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
              OSCComDtValidação: moment().subtract(3, "hours").toDate(),
              OSCComAceite: action === "accept" ? true : false,
              OSCComMotivo: reject,
            });

          dados = await Database.select("*")
            .from("dbo.OSCtrl")
            .where({ OSCId: OSID });

          if (action === "accept") {
            await Mail.send(
              "emails.OSComValida",
              {
                ID: OSID,
                Dt: moment(dados[0].OSCDtPretendida).format("LL"),
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
          } else if (action === "reject") {
            Mail.send(
              "emails.OSRejeicao",
              {
                ID: OSID,
                Dep: "Comercial",
                Motivo: reject,
              },
              (message) => {
                message
                  .to(Env.get("EMAIL_SUPORTE"))
                  .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
                  .subject("OS Rejeitada")
                  .attach(Helpers.publicPath(`OS/${dados[0].OSCPDF}`), {
                    filename: dados[0].OSCPDF,
                  });
              }
            );
          }

          response.status(200).send();
          break;
        case "Técnica Pilão":
          await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCTecDtValidação: moment().subtract(3, "hours").toDate(),
              OSCTecAceite: action === "accept" ? true : false,
              OSCTecMotivo: reject,
              OSCTecDtPrevisao:
                prev !== null
                  ? moment(prev).subtract(3, "hours").toDate()
                  : null,
            });

          dados = await Database.select("*")
            .from("dbo.OSCtrl")
            .where({ OSCId: OSID });
          if (action === "accept") {
            Mail.send(
              "emails.OSTecValida",
              {
                ID: OSID,
                DtC: moment(dados[0].OSCDtPretendida).format("LL"),
                DtT: moment(prev).format("LL"),
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
          } else if (action === "reject") {
            Mail.send(
              "emails.OSRejeicao",
              {
                ID: OSID,
                Dep: "Técnica",
                Motivo: reject,
              },
              (message) => {
                message
                  .to(Env.get("EMAIL_SUPORTE"))
                  .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
                  .subject("OS Rejeitada")
                  .attach(Helpers.publicPath(`OS/${dados[0].OSCPDF}`), {
                    filename: dados[0].OSCPDF,
                  });
              }
            );
          }

          response.status(200).send();
          break;
        case "Técnica Bianchi":
          await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCTecDtValidação: moment().subtract(3, "hours").toDate(),
              OSCTecAceite: action === "accept" ? true : false,
              OSCTecMotivo: reject,
              OSCTecDtPrevisao:
                prev !== null
                  ? moment(prev).subtract(3, "hours").toDate()
                  : null,
            });

          dados = await Database.select("*")
            .from("dbo.OSCtrl")
            .where({ OSCId: OSID });
          if (action === "accept") {
            Mail.send(
              "emails.OSTecValida",
              {
                ID: OSID,
                DtC: moment(dados[0].OSCDtPretendida).format("LL"),
                DtT: moment(prev).format("LL"),
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
          } else if (action === "reject") {
            Mail.send(
              "emails.OSRejeicao",
              {
                ID: OSID,
                Dep: "Técnica",
                Motivo: reject,
              },
              (message) => {
                message
                  .to(Env.get("EMAIL_SUPORTE"))
                  .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
                  .subject("OS Rejeitada")
                  .attach(Helpers.publicPath(`OS/${dados[0].OSCPDF}`), {
                    filename: dados[0].OSCPDF,
                  });
              }
            );
          }

          response.status(200).send();
          break;
        case "Expedição":
          await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCExpDtPrevisao:
                prev !== null
                  ? moment(prev).subtract(3, "hours").toDate()
                  : null,
            });

          dados = await Database.select("*")
            .from("dbo.OSCtrl")
            .where({ OSCId: OSID });

          Mail.send(
            "emails.OSExpValida",
            {
              ID: OSID,
              Dt: moment(prev).format("LL"),
              Tel: dados[0].OSCTelCont,
              Frontend: Env.get("CLIENT_URL"),
            },
            (message) => {
              message
                .to(dados[0].OSCEmail)
                .cc([Env.get("EMAIL_SUPORTE"), Env.get("EMAIL_COMERCIAL_1"), Env.get("EMAIL_COMERCIAL_2")])
                .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
                .subject("Previsão de entrega da OS")
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
              OSCStatus: action === "accept" ? "Concluido" : "Cancelado",
              OSCDtFechamento: moment().subtract(3, "hours").toDate(),
            });

          dados = await Database.select("*")
            .from("dbo.OSCtrl")
            .where({ OSCId: OSID });

          if (action === "reject") {
            Mail.send("emails.OScancel", { verified, ID: OSID }, (message) => {
              message
                .to(Env.get("EMAIL_SUPORTE"))
                .cc([Env.get("EMAIL_COMERCIAL_1"), Env.get("EMAIL_COMERCIAL_2")])
                .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
                .subject("Cancelamento de OS")
                .attach(Helpers.publicPath(`OS/${dados[0].OSCPDF}`), {
                  filename: dados[0].OSCPDF,
                });
            });
          }
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
    let S;
    try {
      const verified = seeToken(token);

      if (verified.role !== "Sistema") throw Error;

      switch (action) {
        case "Cancelar": //cancelar OS
          S = await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCStatus: "Cancelado",
              OSCDtFechamento: moment().subtract(3, "hours").toDate(),
            });
          if (S < 1) throw Error;

          response.status(200).send();
          break;
        case "Concluir": //concluir OS
          S = await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCStatus: "Concluido",
              OSCDtFechamento: moment().subtract(3, "hours").toDate(),
            });
          if (S < 1) throw Error;

          response.status(200).send();
          break;
        case "Ativar": //Ativar OS
          S = await Database.table("dbo.OSCtrl")
            .where({
              OSCId: OSID,
            })
            .update({
              OSCStatus: "Ativo",
              OSCDtFechamento: null,
            });
          if (S < 1) throw Error;

          response.status(200).send();
          break;
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
          break;
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
          break;
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
          break;
      }
    } catch (err) {
      response.status(400).send();
    }
  }
}

module.exports = EquipRequestController;
