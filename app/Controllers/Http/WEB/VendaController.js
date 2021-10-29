"use strict";
const Database = use("Database");
const Drive = use("Drive");
const { seeToken } = require("../../../POG/index");
const moment = require("moment");
class VendaController {
  async Produtos({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const Produtos = await Database.raw(queryListaDeProdutos, []);

      const Clientes = await Database.select("*").from("dbo.Cliente").where({
        GrpVen: verified.grpven,
      }).orderBy('Nome_Fantasia', 'ASC');

      const CodPag = await Database.select("CpgDesc", "CpgId")
        .from("dbo.CondicaoPagamento")
        .where({ GrpVen: "000000" })
        .orderBy("CpgDesc", "ASC");

      const Depositos = await Database.select("*").from("dbo.Deposito").where({
        GrpVen: verified.grpven,
      });

      let aux = [];

      Produtos.map((element) =>
        aux.push({ ...element, QVenda: 0, VVenda: element.PrVenda, DVenda: 0 })
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

  async Store({ request, response }) {
    const token = request.header("authorization");

    const { Pedido } = request.only(["Pedido"]);

    try {
      const verified = seeToken(token);

      const ultPvcId = await Database.raw("select MAX(PvcID) as UltimoID from dbo.PedidosVendaCab where PvcSerie = 'F' and GrpVen = ?", [verified.grpven]);

      const actualDate = new Date(moment().format())

      await Database.insert({
        GrpVen: verified.grpven,
        PvcSerie: 'F',
        PvcID: Number(ultPvcId[0].UltimoID) + 1,
        CNPJ: Pedido.Cliente.CNPJ,
        Filial: verified.user_code,
        CpgId: Pedido.CondPag,
        DataCriacao: actualDate,
        DataIntegracao: null,
        DepId: Pedido.TipoVenda !== 'B' ? Pedido.TipoVenda === 'V' ? 1 : Pedido.RemOrigem : 0,
        DepIdDest: Pedido.TipoVenda !== 'B' ? Pedido.TipoVenda === 'V' ? 0 : Pedido.RemOrigem : 0,
        PvTipo: Pedido.TipoVenda,
        STATUS: 'P',
        MsgNF: Pedido.OBS
      }).into("dbo.PedidosVendaCab");

      Pedido.Carrinho.forEach(async (item, i) => {
        await Database.insert({
          GrpVen: verified.grpven,
          PvcSerie: 'F',
          PvcID: Number(ultPvcId[0].UltimoID) + 1,
          PvdID: i + 1,
          ProdId: item.ProdId[0],
          PvdQtd: item.QVenda * item.FatConversao,
          PvdVlrUnit: item.VVenda,
          PvdVlrTotal: (item.QVenda * item.FatConversao) * (item.VVenda - item.DVenda),
          DataCriacao: actualDate,
          PdvVlrDesc: item.DVenda
        }).into("dbo.PedidosVendaDet");
      });

      response.status(200).send({ message: "ok" });
    } catch (err) {
      response.status(200).send(err);
    }
  }

  async CancelVenda({ request, response, params }) {
    const token = request.header("authorization");
    const serie = params.serie;
    const pvc = params.pvc;

    try {
      const verified = seeToken(token);

      await Database.table('dbo.PedidosVendaCab')
        .where({
          PvcID: pvc,
          PvcSerie: serie,
          GrpVen: verified.grpven,
          STATUS: 'P'
        })
        .update({
          STATUS: 'C'
        });

      response.status(200).send({ message: 'ok' })
    } catch (err) {
      response.status(400).send(err)
    }
  }

  async RequestNFeGeneration({ request, response, params }) {
    const token = request.header("authorization");
    const PvcID = params.pvc;
    const PvcSerie = params.serie;

    try {
      const verified = seeToken(token);

      //verificar no sigamat se o cara pode faturar
      const Sigamat = await Database.select("M0_EmiteNF")
        .from("dbo.SIGAMAT")
        .where({
          M0_CODFIL: verified.user_code,
        });
      if (Sigamat[0].M0_EmiteNF === "N") throw new Error();

      //verifico se a nota já foi gerada, foi cancelada ou já foi solicitada.
      const NotaGerada = await Database.select("*")
        .from("dbo.PedidosVendaCab")
        .where({
          PvcID: PvcID,
        });
      if (
        NotaGerada[0].STATUS === "C" ||
        NotaGerada[0].STATUS === "S" ||
        NotaGerada[0].STATUS == "F"
      )
        throw new Error();

      if (NotaGerada[0].PvTipo === "B") {
        await Database.table('dbo.PedidosVendaDet')
          .where({
            GrpVen: verified.grpven,
            PvcSerie: PvcSerie,
            PvcID: PvcID
          })
          .update({
            PvdTES: '511'
          });
      }

      if (NotaGerada[0].PvTipo === "R") {
        //update o pedido de bonificacao com o CNPJ do próprio franqueado
        await Database.raw(
          "UPDATE dbo.PedidosVendaCab SET CNPJ = (select top(1) M0_CGC from dbo.FilialEntidadeGrVenda where A1_GRPVEN = ?) WHERE GrpVen = ? AND P.PvcSerie= ? AND P.PvcID = ?",
          [verified.grpven, verified.grpven, PvcSerie, PvcID]
        );

        //update de tes no pedido
        await Database.raw(
          "UPDATE dbo.PedidosVendaDet SET PvdTES = '979' WHERE GrpVen = ? AND PvcSerie = ? AND PvcID = ?",
          [verified.grpven, PvcSerie, PvcID]
        );
      }

      await Database.raw(
        "UPDATE P SET P.PvdTES = [TES] FROM ( dbo.FilialEntidadeGrVenda AS F INNER JOIN dbo.FilialTES AS T ON F.M0_CODFIL = T.FILIAL ) INNER JOIN dbo.PedidosVendaDet AS P ON F.A1_GRPVEN = P.GrpVen WHERE P.PvcSerie = 'F' AND P.PvdTES Is Null",
        []
      );

      await Database.raw(
        "UPDATE P SET P.PvdTES = [TES] FROM ( dbo.FilialEntidadeGrVenda AS F INNER JOIN dbo.PedidosVendaDet AS P ON F.A1_GRPVEN = P.GrpVen ) INNER JOIN dbo.FilialProdIdTES AS T ON (P.ProdId = T.ProdId) AND (F.M0_CODFIL = T.FILIAL) WHERE ( ((P.PvdTES) Is Null) AND ((P.PvcSerie) = 'F') )",
        []
      );

      await Database.raw(
        "UPDATE P SET P.PvdTES = [TES] FROM dbo.PedidosVendaDet AS P INNER JOIN dbo.ProdIdTES AS T ON P.ProdId = T.ProdId WHERE ( ((P.PvcSerie) = 'F') AND ((P.PvdTES) Is Null) )",
        []
      );

      await Database.raw(
        "UPDATE P SET P.PvdNatureza = [NATUREZA] FROM ( dbo.PedidosVendaDet AS P INNER JOIN dbo.FilialEntidadeGrVenda AS F ON P.GrpVen = F.A1_GRPVEN ) INNER JOIN FilialProdIdNatureza AS N ON (P.ProdId = N.ProdId) AND (F.M0_CODFIL = N.FILIAL) WHERE P.PvdNatureza Is Null AND P.PvcSerie = 'F'",
        []
      );

      await Database.raw(
        "UPDATE P SET P.PvdNatureza = [NATUREZA] FROM dbo.PedidosVendaDet AS P INNER JOIN ProdIdNatureza AS N ON P.ProdId = N.ProdId WHERE P.PvdNatureza Is Null AND P.PvcSerie = 'F'",
        []
      );

      const UltimoIDPedido = await Database.raw('select MAX(PedidoID) as UltimoID from dbo.PedidosVenda', [])
      const NovoIDPedido = Number(UltimoIDPedido[0].UltimoID) + 1

      const PedidoParaFaturar = await Database.raw(queryPedidosParaFaturar, [NovoIDPedido, verified.grpven, PvcID])

      PedidoParaFaturar.forEach(async (item, i) => {
        await Database.insert({
          GrpVen: verified.grpven,
          Filial: verified.user_code,
          PedidoID: NovoIDPedido,
          PedidoItemID: i + 1,
          CodigoCliente: item.A1_COD,
          LojaCliente: item.A1_LOJA,
          CodigoTabelaPreco: item.TNF_TblPreco,
          CodigoVendedor: item.TNF_CodVnd,
          CodigoCondicaoPagto: item.CPag,
          TipoFrete: item.TNF_Frete,
          CodigoProduto: item.CodFab,
          QtdeVendida: item.PvdQtd,
          PrecoUnitarioLiquido: item.PvdVlrUnit,
          PrecoTotal: item.PvdVlrTotal,
          DataCriacao: item.DataCriacao,
          TipOp: item.TNF_TipOp,
          TES: item.PvdTES,
          NATUREZA: item.TNF_NATUREZA,
          MsgNotaFiscal: item.MsgNF,
          VlrDesconto: item.PdvVlrDesc
        }).into('dbo.PedidosVenda')
      })

      await Database.table('dbo.PedidosVendaCab')
        .where({
          GrpVen: verified.grpven,
          PvcSerie: PvcSerie,
          PvcID: PvcID
        })
        .update({
          STATUS: 'S',
          PedidoId: NovoIDPedido
        });

      response.status(200).send({ message: 'ok', pedido: NovoIDPedido });
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async RecoverDocs({ request, response, params }) {
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

const queryPedidosParaFaturar = "SELECT dbo.PedidosVendaCab.GrpVen, dbo.FilialEntidadeGrVenda.M0_CODFIL, ? AS PedidoId, dbo.PedidosVendaDet.PvdID, dbo.Cliente.A1_COD, dbo.Cliente.A1_LOJA, dbo.TipoNF.TNF_TblPreco, dbo.TipoNF.TNF_CodVnd, dbo.CondicaoPagamento.E4_CODIGO AS CPag, dbo.TipoNF.TNF_Frete, dbo.Produtos.CodFab, dbo.PedidosVendaDet.PvdQtd, dbo.PedidosVendaDet.PvdVlrUnit, dbo.PedidosVendaDet.PvdVlrTotal, dbo.PedidosVendaCab.DataCriacao, dbo.TipoNF.TNF_TipOp, dbo.PedidosVendaDet.PvdTES, dbo.TipoNF.TNF_NATUREZA, dbo.PedidosVendaCab.MsgNF, dbo.PedidosVendaDet.PdvVlrDesc FROM ( ( ( ( dbo.Cliente INNER JOIN ( dbo.PedidosVendaCab INNER JOIN dbo.PedidosVendaDet ON ( dbo.PedidosVendaCab.PvcID = dbo.PedidosVendaDet.PvcID ) AND ( dbo.PedidosVendaCab.PvcSerie = dbo.PedidosVendaDet.PvcSerie ) AND ( dbo.PedidosVendaCab.GrpVen = dbo.PedidosVendaDet.GrpVen ) ) ON ( dbo.Cliente.GrpVen = dbo.PedidosVendaCab.GrpVen ) AND ( dbo.Cliente.CNPJ = dbo.PedidosVendaCab.CNPJ ) ) INNER JOIN dbo.FilialEntidadeGrVenda ON dbo.PedidosVendaCab.GrpVen = dbo.FilialEntidadeGrVenda.A1_GRPVEN ) INNER JOIN dbo.CondicaoPagamento ON dbo.PedidosVendaCab.CpgId = dbo.CondicaoPagamento.CpgId ) INNER JOIN dbo.Produtos ON dbo.PedidosVendaDet.ProdId = dbo.Produtos.ProdId ) INNER JOIN dbo.TipoNF ON dbo.PedidosVendaCab.PvTipo = dbo.TipoNF.TNFCod WHERE ( ((dbo.PedidosVendaCab.GrpVen) = ?) AND ((dbo.CondicaoPagamento.GrpVen) = '000000') AND ((dbo.PedidosVendaCab.PvcID) = ?) AND ((dbo.PedidosVendaCab.PvcSerie) = 'F'));"