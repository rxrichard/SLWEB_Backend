"use strict";
const Database = use("Database");
const Drive = use("Drive");
const { seeToken } = require("../../../POG/index");
const path = require("path");
const moment = require("moment");
class VendaController {
  async Produtos({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const Produtos = await Database.raw(queryListaDeProdutos, []);

      const Clientes = await Database.select("*").from("dbo.Cliente").where({
        GrpVen: verified.grpven,
      });

      const CodPag = await Database.select("CpgDesc", "CpgId")
        .from("dbo.CondicaoPagamento")
        .where({ GrpVen: "000000" })
        .orderBy("CpgDesc", "ASC");

      const Depositos = await Database.select("*").from("dbo.Deposito").where({
        GrpVen: verified.grpven,
      });

      let aux = [];

      Produtos.map((element) =>
        aux.push({ ...element, QVenda: 0, VVenda: element.PrVenda })
      );

      response.status(200).send({ Produtos: aux, Clientes, CodPag, Depositos });
    } catch (err) {
      response.status(400);
    }
  }

  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const pedidos = await Database.raw(
        "execute dbo.ProcPedidosVendaCab @GrpVen = ?",
        [verified.grpven]
      );

      response.status(200).send({ Pedidos: pedidos });
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async See({ request, response, params }) {
    const token = request.header("authorization");
    const serie = params.serie;
    const pvc = params.pvc;

    try {
      const verified = seeToken(token);

      const detalhes = await Database.raw(
        "execute dbo.ProcPedidosVendaDet @GrpVen = ?, @Serie = ?, @Doc = ?",
        [verified.grpven, serie, pvc]
      );

      response.status(200).send(detalhes);
    } catch (err) {
      response.status(400).send(err);
    }
  }

  // async Store({ request, response }) {
  //   const token = request.header("authorization");
  //   const {
  //     Carrinho,
  //     Cliente,
  //     OBS,
  //     TipoVenda,
  //     CondPag,
  //     RemOrigem,
  //     RemDestino,
  //   } = request.only([
  //     "Carrinho",
  //     "Cliente",
  //     "OBS",
  //     "TipoVenda",
  //     "CondPag",
  //     "RemOrigem",
  //     "RemDestino",
  //   ]);

  //   try {
  //     const verified = seeToken(token);

  //     //verificar se o carrinho está vazio
  //     //verificar se tem item com QTD zerada no carrinho
  //     //verificar se o cliente foi definido
  //     //verificar se o tipo de operação foi definido(venda/bonificação/remessa)
  //     //verificar se o tipo de pagamento foi definido no caso venda
  //     //verificar se os depósitos foram definidos no caso remessa

  //     const ultPvcId = await Database.raw(
  //       "select MAX(PvcID) as UltimoID from dbo.PedidosVendaCab where PvcSerie = 'F' and GrpVen = ?",
  //       [verified.grpven]
  //     );

  //     const newCab = await Database.insert({
  //       GrpVen: ,
  //       PvcSerie: ,
  //       PvcID: ,
  //       STATUS: ,
  //       CNPJ: ,
  //       Filial: ,
  //       CpgId: ,
  //       DataCriacao: ,
  //       DataIntegracao: ,
  //       DepId: ,
  //       DepIdDest: ,
  //       PvTipo: ,
  //       DtEmissao: ,
  //       F3_CODRSEF: ,
  //       F3_DESCRET: ,
  //       PedidoId: ,
  //       PDF: ,
  //       NroNF: ,
  //       SerieNF: ,
  //       DtEmissNF: ,
  //       ChaveNF: ,
  //       MsgNF: ,
  //       PedidoN:
  //     }).into("dbo.PedidosVendaCab");

  //     Carrinho.forEach((item) => {
  //       const newDet = await Database.insert({
  //         GrpVen: ,
  //         PvcSerie: ,
  //         PvcID: ,
  //         PvdID: ,
  //         ProdId: ,
  //         PvdQtd: ,
  //         PvdVlrUnit: ,
  //         PvdVlrTotal: ,
  //         DataCriacao: ,
  //         PvdTES: ,
  //         PvdTipOp: ,
  //         PvdNatureza: ,
  //         PdvVlrDesc:
  //       }).into("dbo.PedidosVendaDet");
  //     });

  //     response.status(200).send({ message: "ok" });
  //   } catch (err) {
  //     response.status(200).send(err);
  //   }
  // }

  // async RequestNFeGeneration({ request, response, params }) {
  //   const token = request.header("authorization");
  //   const PVCID = params.PvcID;

  //   try {
  //     const verified = seeToken(token);

  //     //verificar no sigamat se o cara pode faturar
  //     const Sigamat = await Database.select("M0_EmiteNF")
  //       .from("dbo.SIGAMAT")
  //       .where({
  //         M0_CODFIL: verified.user_code,
  //       });
  //     if (Sigamat[0].M0_EmiteNF === "N") throw new Error();

  //     //verifico se a nota já foi gerada, foi cancelada ou já foi solicitada.
  //     const NotaGerada = await Database.select("*")
  //       .from("dbo.PedidosVendaCab")
  //       .where({
  //         PvcID: PVCID,
  //       });
  //     if (
  //       NotaGerada[0].PvcSerie == "1" ||
  //       NotaGerada[0].STATUS === "C" ||
  //       NotaGerada[0].STATUS === "S"
  //     )
  //       throw new Error();

  //     if (NotaGerada[0].PvTipo === "B") {
  //       const B = await Database.raw(
  //         "UPDATE dbo_PedidosVendaDet_srv SET PvdTES = '511' WHERE GrpVen= ? AND PvcSerie='F' AND PvcID= ?",
  //         [verified.grpven, PVCID]
  //       );
  //     } else if (NotaGerada[0].PvTipo === "R") {
  //       const R0 = await Database.raw(
  //         "UPDATE dbo_PedidosVendaCab_srv AS P INNER JOIN dbo_FilialEntidadeGrVenda_srv AS F ON P.GrpVen = F.A1_GRPVEN SET P.CNPJ = [M0_CGC] WHERE P.GrpVen = ? AND P.PvcSerie='F' AND P.PvcID = ?",
  //         [verified.grpven, PVCID]
  //       );
  //       const R1 = await Database.raw(
  //         "UPDATE dbo_PedidosVendaDet_srv SET PvdTES = '979' WHERE GrpVen = ? AND PvcSerie = 'F' AND PvcID = ?",
  //         [verified.grpven, PVCID]
  //       );
  //     } else if (NotaGerada[0].PvTipo === "V") {
  //       const V1 = await Database.raw(
  //         "UPDATE (dbo_FilialEntidadeGrVenda_srv AS F INNER JOIN dbo_FilialTES_srv AS T ON F.M0_CODFIL = T.FILIAL) INNER JOIN dbo_PedidosVendaDet_srv AS P ON F.A1_GRPVEN = P.GrpVen SET P.PvdTES = [TES] WHERE P.PvcSerie='F' AND P.PvdTES Is Null",
  //         []
  //       );

  //       const V2 = await Database.raw(
  //         "UPDATE (dbo_FilialEntidadeGrVenda_srv AS F INNER JOIN dbo_PedidosVendaDet_srv AS P ON F.A1_GRPVEN = P.GrpVen) INNER JOIN dbo_FilialProdIdTES_srv AS T ON (P.ProdId = T.ProdId) AND (F.M0_CODFIL = T.FILIAL) SET P.PvdTES = [TES] WHERE (((P.PvdTES) Is Null) AND ((P.PvcSerie)='F'))",
  //         []
  //       );

  //       const V3 = await Database.raw(
  //         "UPDATE dbo_PedidosVendaDet_srv AS P INNER JOIN dbo_ProdIdTES_srv AS T ON P.ProdId = T.ProdId SET P.PvdTES = [TES] WHERE (((P.PvcSerie)='F') AND ((P.PvdTES) Is Null))",
  //         []
  //       );

  //       const V4 = await Database.raw(
  //         "UPDATE (dbo_PedidosVendaDet_srv AS P INNER JOIN dbo_FilialEntidadeGrVenda_srv AS F ON P.GrpVen = F.A1_GRPVEN) INNER JOIN FilialProdIdNatureza AS N ON (P.ProdId = N.ProdId) AND (F.M0_CODFIL = N.FILIAL) SET P.PvdNatureza = [NATUREZA] WHERE P.PvdNatureza Is Null AND P.PvcSerie='F'",
  //         []
  //       );

  //       const V5 = await Database.raw(
  //         "UPDATE dbo_PedidosVendaDet_srv AS P INNER JOIN ProdIdNatureza AS N ON P.ProdId = N.ProdId SET P.PvdNatureza = [NATUREZA] WHERE P.PvdNatureza Is Null AND P.PvcSerie='F'",
  //         []
  //       );

  //       const NovoIDPedido = await Database.raw('select MAX(PedidoID) as UltimoID from dbo.PedidosVenda', [])

  //       const newRow = await Database.insert({
  //         GrpVen: verified.grpven,
  //         Filial: verified.user_code,
  //         PedidoId: Number(NovoIDPedido[0].UltimoID) + 1,
  //         PedidoItemID: ,
  //         CodigoCliente: ,
  //         LojaCliente: ,
  //         CodigoTabelaPreco: '002',
  //         CodigoVendedor: '000026',
  //         CodigoCondicaoPagto: ,
  //         TipoFrete: ,
  //         CodigoProduto: ,
  //         QtdeVendida: ,
  //         PrecoUnitarioLiquido: ,
  //         PrecoTotal: ,
  //         DataCriacao: ,
  //         TipOp: ,
  //         TES: ,
  //         NATUREZA: ,
  //         MsgNotaFiscal: ,
  //         VlrDesconto:
  //       }).into('dbo_PedidosVenda_srv')
  //     }
  //   } catch (err) {
  //     response.status(400).send(err);
  //   }
  // }

  async RecoverDanfe({ request, response, params }) {
    const token = request.header("authorization");
    const serie = params.serie;
    const pvc = params.pvc;
    const doctype = params.doctype;
    let retorno = { message: "Vazio" };

    try {
      const verified = seeToken(token);

      const numeroExterno = await Database.select("PedidoId")
        .from("dbo.PedidosVendaCab")
        .where({
          GrpVen: verified.grpven,
          PvcSerie: serie,
          PvcID: pvc,
        });

      const NFe = await Database.connection("pg")
        .select("num_pedido", "chave_de_acesso")
        .from("swvix.pedido")
        .where({
          num_externo: numeroExterno[0].PedidoId,
          status: "1",
          localestoque: verified.user_code,
        });

      const prefixoCancelamento = "110111";
      const prefixoCartaDeCorrecao = "110110";
      /*o 01 é a ordem do evento, 
      cancelamento(110111) sempre tem a ordem 01(não da pra cancelar duas vezes a mesma nota),
      já carta de correcao pode ter 02, 03...
      */
      const sulfixoComum = "01-procEventoNFe.xml";

      const names = {
        nomeDanfe:
          `000000000000000000000000000000${NFe[0].num_pedido}_nfe_-DANFE.pdf`.slice(
            -45
          ),
        nomeXml:
          `000000000000000000000000000000${NFe[0].num_pedido}_nfe_.xml`.slice(
            -39
          ),
        nomeCancelamento: `${prefixoCancelamento}${NFe[0].chave_de_acesso}${sulfixoComum}`,
        nomeCartaDeCorrecao: `${prefixoCartaDeCorrecao}${NFe[0].chave_de_acesso}${sulfixoComum}`,
      };
      //pegar nota de devolucao tambem?

      const paths = {
        toDANFE: `\\\\192.168.1.104\\Integratto2\\Xml\\Emissao\\Resposta\\${names.nomeDanfe}`,
        toXML: `\\\\192.168.1.104\\Integratto2\\Xml\\Emissao\\Resposta\\${names.nomeXml}`,
        toCancelamento: `\\\\192.168.1.104\\Integratto2\\Docs\\${names.nomeCancelamento}`,
        toCCorrecao: `\\\\192.168.1.104\\Integratto2\\Docs\\${names.nomeCartaDeCorrecao}`,
      };

      switch (doctype) {
        case "DANFE":
          retorno =
            (await Drive.exists(paths.toDANFE)) &&
            (await Drive.get(paths.toDANFE));
          break;
        case "XML":
          retorno =
            (await Drive.exists(paths.toXML)) && (await Drive.get(paths.toXML));
          break;
        case "CANCELAMENTO":
          retorno =
            (await Drive.exists(paths.toCancelamento)) &&
            (await Drive.get(paths.toCancelamento));
          break;
        case "CC":
          retorno =
            (await Drive.exists(paths.toCCorrecao)) &&
            (await Drive.get(paths.toCCorrecao));
          break;
      }

      response.status(200).send(retorno);
    } catch (err) {
      response.status(400).send(err);
    }
  }
}

module.exports = VendaController;

const queryListaDeProdutos =
  "select * from dbo.PrecoVenda as PV inner join dbo.Produtos as Pr on PV.ProdId = Pr.ProdId where Pr.Venda = 'S' and PV.GrpVen = '000000' and PV.AnxId = 0 and PV.PdvId = 0 and Pr.Atv2Inat1 = 2 order by Pr.Produto";
