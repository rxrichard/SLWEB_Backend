"use strict";
const Database = use("Database");
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
      });
      const CodPag = await Database.select("CpgDesc", "CpgId")
        .from("dbo.CondicaoPagamento")
        .where({ GrpVen: "000000" })
        .orderBy("CpgDesc", "ASC");

      let aux = [];

      Produtos.map((element) =>
        aux.push({ ...element, QVenda: 0, VVenda: element.PrVenda })
      );

      response.status(200).send({ Produtos: aux, Clientes, CodPag });
    } catch (err) {
      response.status(400);
    }
  }
}

module.exports = VendaController;

const queryListaDeProdutos =
  "select * from dbo.PrecoVenda as PV inner join dbo.Produtos as Pr on PV.ProdId = Pr.ProdId where Pr.Venda = 'S' and PV.GrpVen = '000000' and PV.AnxId = 0 and PV.PdvId = 0 and Pr.Atv2Inat1 = 2 order by Pr.Produto";
