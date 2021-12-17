"use strict";
const Database = use("Database");
const Drive = use("Drive");
const Helpers = use("Helpers");
const { seeToken } = require("../../../POG/jwt");
const moment = require("moment");

class CompraController {
  /** @param {object} ctx
   * @param {import('@adonisjs/framework/src/Request')} ctx.request
   */
  async Produtos({ request, response }) {
    const token = request.header("authorization");
    
    try {
      seeToken(token);

      const Produtos = await Database.raw(queryProdutos);

      let aux = [];

      Produtos.map((element) => aux.push({ ...element, QCompra: 0 }));

      response.status(200).send(aux);
    } catch (err) {
      response.status(400);
    }
  }

  async Contas({ request, response }) {
    const token = request.header("authorization");
    try {
      const verified = seeToken(token);

      const InfoCompras = await Database.raw(queryGigante1, [verified.grpven]);

      const InfoBloqueado = await Database.raw(queryBloqueado, [
        verified.grpven,
      ]);

      const DuplicatasAberto = await Database.raw(
        queryDuplicatas,
        verified.grpven
      );

      const PedidosNaoFaturados = await Database.raw(
        "SELECT IIF(Sum(dbo.PedidosVenda.PrecoTotal) is null, 0, Sum(dbo.PedidosVenda.PrecoTotal)) AS Total FROM dbo.PedidosVenda INNER JOIN dbo.PedidosCompraCab ON (     dbo.PedidosVenda.Filial = dbo.PedidosCompraCab.Filial ) AND (     dbo.PedidosVenda.PedidoID = dbo.PedidosCompraCab.PedidoId ) WHERE (     ((dbo.PedidosCompraCab.NroNF) Is Null)     AND ((dbo.PedidosCompraCab.GrpVen) = ?)     AND (    (dbo.PedidosVenda.STATUS) <> 'C'    Or (dbo.PedidosVenda.STATUS) Is Null and dbo.PedidosCompraCab.STATUS <> 'C' or dbo.PedidosCompraCab.STATUS is null     ) )",
        [verified.grpven]
      );

      const ComprasAoAno = await Database.raw(queryComprasAno, verified.grpven);

      const Geral = {
        ...Object.assign(InfoCompras[0], InfoBloqueado[0]),
        Compras: InfoCompras[0].Compras + PedidosNaoFaturados[0].Total,
        LimiteAtual: InfoCompras[0].LimiteAtual - PedidosNaoFaturados[0].Total,
      };

      response.status(200).send({
        Geral: Geral,
        Duplicatas: DuplicatasAberto,
        ComprasAno: ComprasAoAno,
        AFaturar: PedidosNaoFaturados,
      });
    } catch (err) {
      response.status(400);
    }
  }

  async Pedidos({ request, response }) {
    const token = request.header("authorization");
    try {
      const verified = seeToken(token);

      const PedidosAbertos = await Database.raw(queryPedidosNaoAtendidos, [
        verified.grpven,
      ]);

      const PedidosFaturados = await Database.raw(queryPedidosAtendidos, [
        verified.grpven,
      ]);

      response.status(200).send({ PedidosAbertos, PedidosFaturados });
    } catch (err) {
      response.status(400);
    }
  }

  async PedidoDet({ request, response, params }) {
    const token = request.header("authorization");
    const PedidoID = params.ID;
    const Status = params.STATUS;

    try {
      const verified = seeToken(token);

      let PedidoDet = [];
      let newPedDet = [];

      let Pedido = {
        Transportadora: null,
        Status: Status,
        Data: null,
        Detalhes: [],
      };

      if (Status === "Faturado") {
        //busca nos pedidos atendidos
        PedidoDet = await Database.raw(queryPedidosAtendidosDetPorPedidoID, [
          verified.grpven,
          verified.user_code,
          PedidoID,
        ]);

        if (PedidoDet.length > 0) {
          const transp = await Database.raw(
            "execute ProcNotaTransportadora @Doc = ? , @Filial = '0201'",
            [PedidoDet[0].DOC]
          );

          transp.length > 0
            ? (Pedido.Transportadora = transp[0].A4_NOME)
            : null;

          Pedido.Data = PedidoDet[0].Emissao;
        }

        PedidoDet.map((det) => {
          newPedDet.push({
            id: det.ProdId,
            Produto: det.Produto,
            UN: det.D_UM,
            Quantidade: det.D_QUANT,
            VlrUn: det.D_PRCVEN,
            VlrTotal: det.D_TOTAL,
          });
        });

        Pedido.Detalhes = newPedDet;
      }

      if (Status === "DOC") {
        //busca nos pedidos atendidos
        PedidoDet = await Database.raw(queryPedidosAtendidosDetPorDocNum, [
          verified.grpven,
          verified.user_code,
          PedidoID,
        ]);

        if (PedidoDet.length > 0) {
          const transp = await Database.raw(
            "execute ProcNotaTransportadora @Doc = ? , @Filial = '0201'",
            [PedidoDet[0].DOC]
          );

          transp.length > 0
            ? (Pedido.Transportadora = transp[0].A4_NOME)
            : null;

          Pedido.Data = PedidoDet[0].Emissao;
        }

        PedidoDet.map((det) => {
          newPedDet.push({
            id: det.ProdId,
            Produto: det.Produto,
            UN: det.D_UM,
            Quantidade: det.D_QUANT,
            VlrUn: det.D_PRCVEN,
            VlrTotal: det.D_TOTAL,
          });
        });

        Pedido.Detalhes = newPedDet;
      }

      if (Status === "Processando") {
        //busca nos pedidos não atendidos
        PedidoDet = await Database.raw(
          "execute ProcPedidosCompraEmAbertoDet @PedId = ?",
          [PedidoID]
        );

        if (PedidoDet.length > 0) {
          Pedido.Data = PedidoDet[0].Solicitação;
        }

        PedidoDet.map((det) => {
          newPedDet.push({
            id: det.ProdId,
            Produto: det.Produto,
            UN: det.UnMedida,
            Quantidade: det.Qtd,
            VlrUn: det.VlrUnit,
            VlrTotal: det.VlrTotal,
          });
        });

        Pedido.Detalhes = newPedDet;
      }

      Pedido.PedidoId = PedidoID;

      response.status(200).send(Pedido);
    } catch (err) {
      response.status(400);
    }
  }

  async Comprar({ request, response }) {
    const token = request.header("authorization");
    const { Items, Obs, Retira } = request.only(["Items", "Obs", "Retira"]);

    try {
      const verified = seeToken(token);

      //verifico se o pedido tem pelo menos 1 item
      if (Items.length === 0) {
        throw new Error();
      }

      //testar se o cara tem limite
      const limite = await Database.raw(queryLimiteDisponivel, [
        verified.grpven,
      ]);

      const PedidosNaoFaturados = await Database.raw(
        "SELECT IIF(Sum(dbo.PedidosVenda.PrecoTotal) is null, 0, Sum(dbo.PedidosVenda.PrecoTotal)) AS Total FROM dbo.PedidosVenda INNER JOIN dbo.PedidosCompraCab ON (     dbo.PedidosVenda.Filial = dbo.PedidosCompraCab.Filial ) AND (     dbo.PedidosVenda.PedidoID = dbo.PedidosCompraCab.PedidoId ) WHERE (     ((dbo.PedidosCompraCab.NroNF) Is Null)     AND ((dbo.PedidosCompraCab.GrpVen) = ?)     AND (    (dbo.PedidosVenda.STATUS) <> 'C'    Or (dbo.PedidosVenda.STATUS) Is Null and dbo.PedidosCompraCab.STATUS <> 'C' or dbo.PedidosCompraCab.STATUS is null     ) )",
        [verified.grpven]
      );

      let TotalDoPedido = 0;
      Items.map(
        (item) =>
        (TotalDoPedido +=
          Number(item.QCompra) * (Number(item.QtMin) * Number(item.VlrUn)))
      );

      if (
        limite[0].LimiteAtual - PedidosNaoFaturados[0].Total - TotalDoPedido <=
        0
      ) {
        throw new Error();
      }

      //testo se o cara ta bloqueado
      const bloqueado = await Database.raw(queryBloqueado, [verified.grpven]);
      if (bloqueado[0] && bloqueado[0].Bloqueado === "S") {
        throw new Error();
      }

      //busco dados do franqueado
      const Franqueado = await Database.select("A1_COD", "A1_LOJA")
        .from("dbo.FilialEntidadeGrVenda")
        .where({
          A1_GRPVEN: verified.grpven,
        });

      //busco o número do último pedido
      const UltPedidoID = await Database.raw(
        "select MAX(PedidoID) as UltPedido from dbo.PedidosVenda",
        []
      );

      const ProxId = Number(UltPedidoID[0].UltPedido) + 1;

      //salvo o pedido nas tabelas
      await Database.insert({
        GrpVen: verified.grpven,
        PedidoId: ProxId,
        STATUS: null,
        Filial: "0201",
        CpgId: "003",
        DataCriacao: new Date(moment().subtract(3, "hours").format()),
      }).into("dbo.PedidosCompraCab");

      Items.forEach(
        async (item, i) =>
          await Database.insert({
            EMISS: "00",
            SERIE: "1",
            PedidoID: ProxId,
            PedidoItemID: i + 1,
            CodigoCliente: Franqueado[0].A1_COD,
            LojaCliente: Franqueado[0].A1_LOJA,
            CodigoDL: " ",
            LojaDL: " ",
            Filial: "0201",
            CodigoTabelaPreco: "462",
            CodigoVendedor: "000026",
            CodigoCondicaoPagto: "003",
            TipoFrete: "C",
            MsgNotaFiscal: null,
            MsgPadrao: null,
            DataEntrega: null,
            CodigoProduto: `00000${item.Cód}`.slice(-5),
            QtdeVendida: item.QCompra * item.QtMin,
            PrecoUnitarioLiquido: item.VlrUn,
            PrecoTotal: item.QCompra * (item.QtMin * item.VlrUn),
            Limite: null,
            CodigoTotvs: null,
            DataCriacao: new Date(moment().subtract(3, "hours").format()),
            DataIntegracao: null,
            GrpVen: verified.grpven,
            MsgBO: Retira ? Obs.concat(" *FRANQUEADO RETIRA*") : Obs,
            NATUREZA: 10117,
            TipOp: "01",
            TES: String(item.Cód) === "03994" ? "674" : null,
          }).into("dbo.PedidosVenda")
      );

      response.status(200).send(TotalDoPedido);
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async Cancelar({ request, response, params }) {
    const token = request.header("authorization");
    const PedidoId = params.ID;

    try {
      seeToken(token);

      const pedidoCab = await Database.select("STATUS")
        .from("dbo.PedidosCompraCab")
        .where({
          PedidoId: PedidoId,
        });

      const pedidoVenda = await Database.select("DataIntegracao")
        .from("dbo.PedidosVenda")
        .where({
          PedidoID: PedidoId,
        });

      if (pedidoCab[0].STATUS === "C") {
        response.status(400).send({ message: "Pedido já cancelado" });
      } else if (pedidoVenda[0].DataIntegracao !== null) {
        response.status(400).send({ message: "Pedido em processamento" });
      } else {
        await Database.table("dbo.PedidosCompraCab")
          .where({
            PedidoId: PedidoId,
          })
          .update({
            STATUS: "C",
          });

        await Database.table("dbo.PedidosVenda")
          .where({
            PedidoID: PedidoId,
          })
          .update({
            STATUS: "C",
            DataIntegracao: new Date(moment().subtract(3, "hours").format()),
          });
        response.status(200).send({ message: "ok" });
      }
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async RetrivePDF({ request, response, params }) {
    const token = request.header("authorization");
    const PedidoId = params.ID;

    try {
      seeToken(token);

      const path = `\\\\192.168.1.248\\totvs12\\Producao\\protheus_data\\DANFE_FRANQUIA\\0201\\boleto_${PedidoId}.pdf`

      const Imagem = await Drive.exists(path) ? await Drive.get(path) : { message: 'File not found' };

      response.status(200).send(Imagem);
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async CompensarDuplicata({ request, response, }) {
    const token = request.header("authorization");
    const { serie, nf } = request.only(['serie', 'nf']);

    try {
      seeToken(token);

      const exists = await Database.select("*").from('dbo.SE1_exc').where({
        E1Prefixo: serie,
        E1Num: nf,
      })

      if (exists.length > 0) {
        throw new Error('Duplicata já compensada')
      }

      await Database.insert({
        E1Prefixo: serie,
        E1Num: nf,
      }).into('dbo.SE1_exc')

      response.status(200).send()
    } catch (err) {
      response.status(400).send(err)
    }
  }

  async FileUpload({ request, response, params }) {
    const compensar = params.compensar
    const multiples = params.multiples
    const token = request.header("authorization");
    const formData = request.file("formData", {
      types: ["image", "pdf"],
      size: "10mb",
    });
    const verified = seeToken(token);
    let path = Helpers.publicPath(`/COMPROVANTES/${verified.user_code}/${compensar}`);
    let newFileName = ''
    let filenames = []
    let file = null

    try {
      if (multiples === 'N') {

        newFileName = `comprovante-1-${new Date().getTime()}.${formData.subtype}`;

        await formData.move(path, {
          name: newFileName,
          overwrite: true,
        });

        if (!formData.moved()) {
          return formData.errors();
        }

        file = await Drive.get(`${path}/${newFileName}`);
        Drive.put(
          `\\\\192.168.1.250\\dados\\Franquia\\SLWEB\\COMPROVANTES\\${verified.user_code}\\${compensar}\\${newFileName}`,
          file
        );
      } else {
        await formData.moveAll(path, (file, i) => {
          newFileName = `comprovante-${i + 1}-${new Date().getTime()}.${file.subtype}`;
          filenames.push(newFileName);

          return {
            name: newFileName,
            overwrite: true,
          };
        });

        if (!formData.movedAll()) {
          return formData.errors();
        }

        filenames.map(async (name) => {
          file = await Drive.get(`${path}/${name}`);
          Drive.put(
            `\\\\192.168.1.250\\dados\\Franquia\\SLWEB\\COMPROVANTES\\${verified.user_code}\\${compensar}\\${name}`,
            file
          );
        });
      }

      response.status(200).send("Arquivos Salvos");
    } catch (err) {
      response.status(400).send(err);
    }
  }
}

module.exports = CompraController;

const queryProdutos =
  "SELECT dbo.PrecoCompra.ProdId AS Cód, dbo.PrecoCompra.Produto, dbo.Produtos.ProdQtMinCompra AS QtMin, dbo.Produtos.PrCompra AS VlrUn, [ProdQtMinCompra]*[PrCompra] AS Vlr, dbo.Produtos.FatConversao FROM dbo.PrecoCompra INNER JOIN dbo.Produtos ON dbo.PrecoCompra.ProdId = dbo.Produtos.ProdId WHERE dbo.Produtos.Compra = 'S' ORDER BY dbo.PrecoCompra.Produto";

const queryGigante1 =
  "SELECT dbo.FilialEntidadeGrVenda.LimiteCredito, IIF( IIF( dbo.FilialEntidadeGrVenda.DtExtraCredito is null, DATEADD(HOUR, -24, GETDATE()), DATEDIFF( hour, dbo.FilialEntidadeGrVenda.DtExtraCredito, GETDATE() ) ) > 24, 0, IIF( dbo.FilialEntidadeGrVenda.LimExtraCredito is null, 0, dbo.FilialEntidadeGrVenda.LimExtraCredito ) ) as LimExtraCredito, dbo.FilialEntidadeGrVenda.Retira, dbo.FilialEntidadeGrVenda.VlrMinCompra, SE1_GrpVenT.Avencer, SE1_GrpVenT.Vencida, SE1_ComprasNVencidas.Compras, IIf( [Compras] > 0, [LimiteCredito] + IIF( IIF( dbo.FilialEntidadeGrVenda.DtExtraCredito is null, DATEADD(HOUR, -24, GETDATE()), DATEDIFF( hour, dbo.FilialEntidadeGrVenda.DtExtraCredito, GETDATE() ) ) > 24, 0, dbo.FilialEntidadeGrVenda.LimExtraCredito ) - [Compras], [LimiteCredito] + IIF( IIF( dbo.FilialEntidadeGrVenda.DtExtraCredito is null, DATEADD(HOUR, -24, GETDATE()), DATEDIFF( hour, dbo.FilialEntidadeGrVenda.DtExtraCredito, GETDATE() ) ) > 24, 0, IIF( dbo.FilialEntidadeGrVenda.LimExtraCredito is null, 0, dbo.FilialEntidadeGrVenda.LimExtraCredito ) ) ) AS LimiteAtual FROM ( ( dbo.FilialEntidadeGrVenda LEFT JOIN ( SELECT dbo.SE1_GrpVen.GrpVen, Sum(IIf([SE1DtVencR] > GETDATE(), 0, [E1_SALDO])) AS Avencer, Sum(IIf([SE1DtVencR] < GETDATE(), [E1_SALDO], 0)) AS Vencida FROM ( dbo.SE1_GrpVen INNER JOIN SE1_Class ON (dbo.SE1_GrpVen.E1_PREFIXO = SE1_Class.E1_PREFIXO) AND (dbo.SE1_GrpVen.E1_TIPO = SE1_Class.E1_TIPO) ) LEFT JOIN dbo.SE1DtVenc ON dbo.SE1_GrpVen.DtVenc = dbo.SE1DtVenc.SE1DtVenc GROUP BY dbo.SE1_GrpVen.GrpVen ) as SE1_GrpVenT ON dbo.FilialEntidadeGrVenda.A1_GRPVEN = SE1_GrpVenT.GrpVen ) LEFT JOIN ( SELECT dbo.SE1_GrpVen.GrpVen, Sum(dbo.SE1_GrpVen.E1_SALDO) AS Compras FROM ( dbo.SE1_GrpVen INNER JOIN SE1_Class ON (dbo.SE1_GrpVen.E1_TIPO = SE1_Class.E1_TIPO) AND (dbo.SE1_GrpVen.E1_PREFIXO = SE1_Class.E1_PREFIXO) ) LEFT JOIN dbo.SE1DtVenc ON dbo.SE1_GrpVen.DtVenc = dbo.SE1DtVenc.SE1DtVenc WHERE (((SE1_Class.E1Desc) = 'Compra')) and dbo.SE1_GrpVen.E1_NUM not in (select E1Num from SE1_exc) GROUP BY dbo.SE1_GrpVen.GrpVen ) as SE1_ComprasNVencidas ON dbo.FilialEntidadeGrVenda.A1_GRPVEN = SE1_ComprasNVencidas.GrpVen ) WHERE ( ((dbo.FilialEntidadeGrVenda.Inatv) Is Null) and dbo.FilialEntidadeGrVenda.A1_GRPVEN = ? )";

const queryBloqueado =
  "SELECT IIF(SUM(dbo.SE1_GrpVen.E1_VALOR) > 0, 'S', 'N') as Bloqueado FROM ( dbo.SE1_GrpVen INNER JOIN SE1_Class ON (dbo.SE1_GrpVen.E1_PREFIXO = SE1_Class.E1_PREFIXO) AND (dbo.SE1_GrpVen.E1_TIPO = SE1_Class.E1_TIPO) ) LEFT JOIN dbo.SE1DtVenc ON dbo.SE1_GrpVen.DtVenc = dbo.SE1DtVenc.SE1DtVenc where dbo.SE1_GrpVen.GrpVen = ? and CAST(DtVenc as date) < CAST(GETDATE() as date) and dbo.SE1_GrpVen.E1_NUM not in (select E1Num from SE1_exc)";

const queryDuplicatas =
  "SELECT * FROM ( dbo.SE1_GrpVen INNER JOIN SE1_Class ON (dbo.SE1_GrpVen.E1_PREFIXO = SE1_Class.E1_PREFIXO) AND (dbo.SE1_GrpVen.E1_TIPO = SE1_Class.E1_TIPO) ) LEFT JOIN dbo.SE1DtVenc ON dbo.SE1_GrpVen.DtVenc = dbo.SE1DtVenc.SE1DtVenc WHERE dbo.SE1_GrpVen.GrpVen = ? and dbo.SE1_GrpVen.E1_NUM not in (select E1Num from SE1_exc)";

const queryComprasAno =
  "SELECT * FROM ( SELECT dbo.SE1_GrpVenT.GrpVen, dbo.SE1_GrpVenT.MesE, dbo.SE1_GrpVenT.E1_VALOR FROM dbo.SE1_GrpVenT INNER JOIN SE1_Class ON (dbo.SE1_GrpVenT.E1_TIPO = SE1_Class.E1_TIPO) AND (dbo.SE1_GrpVenT.E1_PREFIXO = SE1_Class.E1_PREFIXO) WHERE (((dbo.SE1_GrpVenT.GrpVen)= ?) AND ((SE1_Class.E1Desc)='Compra') AND ((dbo.SE1_GrpVenT.AnoE)=Year(GETDATE()))) ) t PIVOT (   Sum(t.E1_VALOR)   FOR t.MesE   IN([1], [2], [3], [4],[5],[6],[7],[8],[9],[10],[11],[12]) ) p";

const queryPedidosNaoAtendidos =
  "SELECT 'Processando' AS Status, dbo.PedidosCompraCab.DataCriacao AS Solicitacao, dbo.PedidosCompraCab.PedidoId as Pedido, '' as NF, '' as Serie, Sum(dbo.PedidosVenda.PrecoTotal) AS Total, Count(dbo.PedidosVenda.Item) AS QtItems FROM dbo.PedidosVenda  INNER JOIN dbo.PedidosCompraCab ON (dbo.PedidosVenda.Filial = dbo.PedidosCompraCab.Filial) AND (dbo.PedidosVenda.PedidoID = dbo.PedidosCompraCab.PedidoId)  WHERE (((dbo.PedidosCompraCab.NroNF) Is Null) AND ((dbo.PedidosCompraCab.GrpVen)=?) AND ((dbo.PedidosVenda.STATUS)<>'C' Or (dbo.PedidosVenda.STATUS) Is Null and dbo.PedidosCompraCab.STATUS <> 'C' or dbo.PedidosCompraCab.STATUS is null))  GROUP BY dbo.PedidosCompraCab.STATUS, dbo.PedidosCompraCab.DataCriacao, dbo.PedidosCompraCab.PedidoId, dbo.PedidosVenda.CodigoTotvs  ORDER BY dbo.PedidosCompraCab.DataCriacao DESC";

const queryPedidosAtendidos =
  "SELECT 'Faturado' as Status, S.DtEmissao as Faturado, S.Pedido as Pedido, S.DOC as NF, S.F_SERIE as Serie, SUM(S.D_TOTAL) as Total, COUNT(S.D_ITEM) as QtItems FROM dbo.SDBase as S WHERE S.GRPVEN = ? AND S.M0_TIPO='E' AND S.Pedido<>'0' AND S.F_SERIE = '1' GROUP BY S.D_FILIAL, S.Pedido, S.F_SERIE, S.DOC, S.DtEmissao ORDER BY S.Pedido DESC , S.DtEmissao DESC;";

const queryPedidosAtendidosDetPorPedidoID =
  "SELECT GRPVEN, D_EMISSAO, F_SERIE, DOC, Pedido, D_ITEM, ProdId, Produto, D_UM, D_QUANT, D_PRCVEN, D_TOTAL, DtEmissao AS Emissao, DEPDEST FROM dbo.SDBase WHERE (((GRPVEN)=?) AND ((D_FILIAL)<>?) AND ((M0_TIPO)='E')) AND ((Pedido) = ?) AND F_SERIE = '1' ORDER BY D_EMISSAO DESC";

const queryPedidosAtendidosDetPorDocNum =
  "SELECT GRPVEN, D_EMISSAO, F_SERIE, DOC, Pedido, D_ITEM, ProdId, Produto, D_UM, D_QUANT, D_PRCVEN, D_TOTAL, DtEmissao AS Emissao, DEPDEST FROM dbo.SDBase WHERE (((GRPVEN)=?) AND ((D_FILIAL)<>?) AND ((M0_TIPO)='E')) AND ((DOC) = ?) AND F_SERIE = '1' ORDER BY D_EMISSAO DESC";

const queryLimiteDisponivel =
  "SELECT IIf( [Compras] > 0, [LimiteCredito] + IIF( IIF( dbo.FilialEntidadeGrVenda.DtExtraCredito is null, DATEADD(HOUR, -24, GETDATE()), DATEDIFF( hour, dbo.FilialEntidadeGrVenda.DtExtraCredito, GETDATE() ) ) > 24, 0, dbo.FilialEntidadeGrVenda.LimExtraCredito ) - [Compras], [LimiteCredito] + IIF( IIF( dbo.FilialEntidadeGrVenda.DtExtraCredito is null, DATEADD(HOUR, -24, GETDATE()), DATEDIFF( hour, dbo.FilialEntidadeGrVenda.DtExtraCredito, GETDATE() ) ) > 24, 0, IIF( dbo.FilialEntidadeGrVenda.LimExtraCredito is null, 0, dbo.FilialEntidadeGrVenda.LimExtraCredito ) ) ) AS LimiteAtual FROM dbo.FilialEntidadeGrVenda LEFT JOIN ( SELECT dbo.SE1_GrpVen.GrpVen, Sum(dbo.SE1_GrpVen.E1_SALDO) AS Compras FROM ( dbo.SE1_GrpVen INNER JOIN SE1_Class ON (dbo.SE1_GrpVen.E1_TIPO = SE1_Class.E1_TIPO) AND (dbo.SE1_GrpVen.E1_PREFIXO = SE1_Class.E1_PREFIXO) ) LEFT JOIN dbo.SE1DtVenc ON dbo.SE1_GrpVen.DtVenc = dbo.SE1DtVenc.SE1DtVenc WHERE ( ((SE1_Class.E1Desc) = 'Compra') ) and dbo.SE1_GrpVen.E1_NUM not in ( select E1Num from SE1_exc ) GROUP BY dbo.SE1_GrpVen.GrpVen ) as SE1_ComprasNVencidas ON dbo.FilialEntidadeGrVenda.A1_GRPVEN = SE1_ComprasNVencidas.GrpVen WHERE ( ((dbo.FilialEntidadeGrVenda.Inatv) Is Null) and dbo.FilialEntidadeGrVenda.A1_GRPVEN = ? )";
