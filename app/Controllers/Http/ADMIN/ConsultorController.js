"use strict";

const Helpers = use("Helpers");
const Database = use("Database");
const GerarExcel = require("../../../POG/excelExportService");

class ConsultoreController {
  async GeraTabelaExcel({ response }) {
    const Consultor = "ALESSANDRO";
    const Meses = [
      { Inicio: "2021-04-01 00:00:00", Fim: "2021-04-30 00:00:00" },
      { Inicio: "2021-05-01 00:00:00", Fim: "2021-05-31 00:00:00" },
      { Inicio: "2021-06-01 00:00:00", Fim: "2021-06-30 00:00:00" },
    ];

    const workSheetName = ["Alessandro"];

    const filePath = Helpers.publicPath(`/Endereços Alessandro 16.06.xlsx`);

    const workSheetColumnNames = [
      "Filial",
      "Franqueado(a)",
      "Ativo",
      "Última Leitura",
      "Cliente",
      "Logradouro",
      "Número",
      "Complemento",
      "Bairro",
      "Cidade",
      "UF",
      "CEP",
      "Data de Ativação(SLAPlic)",
      "Doses/Abril",
      "Doses/Maio",
      "Doses/Junho",
    ];
    const data = [];

    const Ativos = await Database.raw(
      "select * from dbo.FiliaisMaquinas where Consultor = ? order by Filial",
      [Consultor]
    );

    const Gambiarra1 = await Database.raw(
      "select DtLeit, Matricula, QuantidadeTotal from dbo.SLTELLeitura where DtLeit >= ? and DtLeit <= ? order by DtLeit ASC",
      [Meses[0].Inicio, Meses[0].Fim]
    );

    const Gambiarra2 = await Database.raw(
      "select DtLeit, Matricula, QuantidadeTotal from dbo.SLTELLeitura where DtLeit >= ? and DtLeit <= ? order by DtLeit ASC",
      [Meses[1].Inicio, Meses[1].Fim]
    );

    const Gambiarra3 = await Database.raw(
      "select DtLeit, Matricula, QuantidadeTotal from dbo.SLTELLeitura where DtLeit >= ? and DtLeit <= ? order by DtLeit ASC",
      [Meses[2].Inicio, Meses[2].Fim]
    );

    Ativos.map((ativo) => {
      data.push([
        ativo.Filial,
        ativo.Franqueado,
        ativo.Ativo,
        ativo.UltLeit,
        ativo.Cliente,
        ativo.Logradouro,
        ativo.Número,
        ativo.Complemento,
        ativo.Bairro,
        ativo.Cidade,
        ativo.UF,
        ativo.CEP,
        ativo.DtAlteração,
      ]);
    });

    let max;
    let min;
    let Valmax;
    let Valmin;

    data.map((Linha) => {
      max = "2021-04-01T00:00:00.000Z";
      min = "2021-12-31T23:59:59.999Z";
      Valmax = 0;
      Valmin = 0;

      Gambiarra1.map((leitura) => {
        if (Linha[2] === leitura.Matricula.trim()) {
          if (new Date(leitura.DtLeit) > new Date(max)) {
            max = new Date(leitura.DtLeit);
            Valmax = leitura.QuantidadeTotal;
          }

          if (new Date(leitura.DtLeit) < new Date(min)) {
            min = new Date(leitura.DtLeit);
            Valmin = leitura.QuantidadeTotal;
          }
        }
        Linha[13] = Valmax - Valmin < 0 ? 0 : Valmax - Valmin;
      });

      max = "2021-04-01T00:00:00.000Z";
      min = "2021-12-31T23:59:59.999Z";
      Valmax = 0;
      Valmin = 0;
    });

    data.map((Linha) => {
      max = "2021-05-01T00:00:00.000Z";
      min = "2021-12-31T23:59:59.999Z";
      Valmax = 0;
      Valmin = 0;

      Gambiarra2.map((leitura) => {
        if (Linha[2] === leitura.Matricula.trim()) {
          if (new Date(leitura.DtLeit) > new Date(max)) {
            max = new Date(leitura.DtLeit);
            Valmax = leitura.QuantidadeTotal;
          }

          if (new Date(leitura.DtLeit) < new Date(min)) {
            min = new Date(leitura.DtLeit);
            Valmin = leitura.QuantidadeTotal;
          }
        }
        Linha[14] = Valmax - Valmin < 0 ? 0 : Valmax - Valmin;
      });

      max = "2021-05-01T00:00:00.000Z";
      min = "2021-12-31T23:59:59.999Z";
      Valmax = 0;
      Valmin = 0;
    });

    data.map((Linha) => {
      max = "2021-06-01T00:00:00.000Z";
      min = "2021-12-31T23:59:59.999Z";
      Valmax = 0;
      Valmin = 0;

      Gambiarra3.map((leitura) => {
        if (Linha[2] === leitura.Matricula.trim()) {
          if (new Date(leitura.DtLeit) > new Date(max)) {
            max = new Date(leitura.DtLeit);
            Valmax = leitura.QuantidadeTotal;
          }

          if (new Date(leitura.DtLeit) < new Date(min)) {
            min = new Date(leitura.DtLeit);
            Valmin = leitura.QuantidadeTotal;
          }
        }
        Linha[15] = Valmax - Valmin < 0 ? 0 : Valmax - Valmin;
      });
      
      max = "2021-06-01T00:00:00.000Z";
      min = "2021-12-31T23:59:59.999Z";
      Valmax = 0;
      Valmin = 0;
    });

    await GerarExcel(data, workSheetColumnNames, workSheetName, filePath);
    // data, workSheetColumnNames, workSheetName, filePath

    response.status(200).send('Ok');

    /*EXPLICAÇÃO DA GAMBIARRA ACIMA: Quando eu usava o .map em dados, 
    ou Ativou ou qualquer outra variavel que contesse os ativos pra buscar a informação de doses no banco de dados 
    a quantidade de requisições era tão grande que o javascript não conseguia esperar 
    o Await da query e devolvia o array incompleto, tentei fixar de varias formas o 
    problema mas sem sucesso e por isso precisei programar como um chimpanzé acima, 
    sito muito ;) */
  }
}

module.exports = ConsultoreController;

/*ANTIGA GERAÇÃO DE EXCEL POR GUIAS
async Teste({ response }) {
  const Consultor = "ALESSANDRO";
  const Meses = [
    { Inicio: "2021-04-01 00:00:00", Fim: "2021-04-30 00:00:00" },
    { Inicio: "2021-05-01 00:00:00", Fim: "2021-05-31 00:00:00" },
    { Inicio: "2021-06-01 00:00:00", Fim: "2021-06-30 00:00:00" },
  ];
  const workSheetName = [];
  const filePath = Helpers.publicPath(`/Endereços Alessandro 15.06.xlsx`);
  const workSheetColumnNames = [
    "Filial",
    "Franqueado(a)",
    "Ativo",
    "Última Leitura",
    "Cliente",
    "Logradouro",
    "Número",
    "Complemento",
    "Bairro",
    "Cidade",
    "UF",
    "CEP",
    "Data de Ativação(SLAPlic)",
    "Doses/Abril",
    "Doses/Maio",
    "Doses/Junho",
  ];
  const data = [];

  const Ativos = await Database.raw(
    "select * from dbo.FiliaisMaquinas where Consultor = ? order by Filial",
    [Consultor]
  );

  const Gambiarra1 = await Database.raw(
    "select DtLeit, Matricula, QuantidadeTotal from dbo.SLTELLeitura where DtLeit >= ? and DtLeit <= ? order by DtLeit ASC",
    [Meses[0].Inicio, Meses[0].Fim]
  );

  const Gambiarra2 = await Database.raw(
    "select DtLeit, Matricula, QuantidadeTotal from dbo.SLTELLeitura where DtLeit >= ? and DtLeit <= ? order by DtLeit ASC",
    [Meses[1].Inicio, Meses[1].Fim]
  );

  const Gambiarra3 = await Database.raw(
    "select DtLeit, Matricula, QuantidadeTotal from dbo.SLTELLeitura where DtLeit >= ? and DtLeit <= ? order by DtLeit ASC",
    [Meses[2].Inicio, Meses[2].Fim]
  );

  Ativos.map((ativo) => {
    if (workSheetName.indexOf(ativo.Filial) < 0) {
      workSheetName.push(ativo.Filial);
      data.push([
        [
          ativo.Filial,
          ativo.Franqueado,
          ativo.Ativo,
          ativo.UltLeit,
          ativo.Cliente,
          ativo.Logradouro,
          ativo.Número,
          ativo.Complemento,
          ativo.Bairro,
          ativo.Cidade,
          ativo.UF,
          ativo.CEP,
          ativo.DtAlteração,
        ],
      ]);
    } else {
      data[workSheetName.indexOf(ativo.Filial)].push([
        ativo.Filial,
        ativo.Franqueado,
        ativo.Ativo,
        ativo.UltLeit,
        ativo.Cliente,
        ativo.Logradouro,
        ativo.Número,
        ativo.Complemento,
        ativo.Bairro,
        ativo.Cidade,
        ativo.UF,
        ativo.CEP,
        ativo.DtAlteração,
      ]);
    }
  });

  let max;
  let min;
  let Valmax;
  let Valmin;

  data.map((Filial) => {
    max = "2021-04-01T00:00:00.000Z";
    min = "2021-12-31T23:59:59.999Z";
    Valmax = 0;
    Valmin = 0;
    Filial.map((Linha) => {
      Gambiarra1.map((leitura) => {
        if (Linha[2] === leitura.Matricula.trim()) {
          if (new Date(leitura.DtLeit) > new Date(max)) {
            max = new Date(leitura.DtLeit);
            Valmax = leitura.QuantidadeTotal;
          }

          if (new Date(leitura.DtLeit) < new Date(min)) {
            min = new Date(leitura.DtLeit);
            Valmin = leitura.QuantidadeTotal;
          }
        }
        Linha[14] = Valmax - Valmin < 0 ? 0 : Valmax - Valmin;
      });

      max = "2021-04-01T00:00:00.000Z";
      min = "2021-12-31T23:59:59.999Z";
      Valmax = 0;
      Valmin = 0;
    });
  });

  data.map((Filial) => {
    max = "2021-05-01T00:00:00.000Z";
    min = "2021-12-31T23:59:59.999Z";
    Valmax = 0;
    Valmin = 0;
    Filial.map((Linha) => {
      Gambiarra2.map((leitura) => {
        if (Linha[2] === leitura.Matricula.trim()) {
          if (new Date(leitura.DtLeit) > new Date(max)) {
            max = new Date(leitura.DtLeit);
            Valmax = leitura.QuantidadeTotal;
          }

          if (new Date(leitura.DtLeit) < new Date(min)) {
            min = new Date(leitura.DtLeit);
            Valmin = leitura.QuantidadeTotal;
          }
        }
        Linha[15] = Valmax - Valmin < 0 ? 0 : Valmax - Valmin;
      });

      max = "2021-05-01T00:00:00.000Z";
      min = "2021-12-31T23:59:59.999Z";
      Valmax = 0;
      Valmin = 0;
    });
  });

  data.map((Filial) => {
    max = "2021-06-01T00:00:00.000Z";
    min = "2021-12-31T23:59:59.999Z";
    Valmax = 0;
    Valmin = 0;
    Filial.map((Linha) => {
      Gambiarra3.map((leitura) => {
        if (Linha[2] === leitura.Matricula.trim()) {
          if (new Date(leitura.DtLeit) > new Date(max)) {
            max = new Date(leitura.DtLeit);
            Valmax = leitura.QuantidadeTotal;
          }

          if (new Date(leitura.DtLeit) < new Date(min)) {
            min = new Date(leitura.DtLeit);
            Valmin = leitura.QuantidadeTotal;
          }
        }
        Linha[16] = Valmax - Valmin < 0 ? 0 : Valmax - Valmin;
      });

      max = "2021-06-01T00:00:00.000Z";
      min = "2021-12-31T23:59:59.999Z";
      Valmax = 0;
      Valmin = 0;
    });
  });

  await GerarExcel(data, workSheetColumnNames, workSheetName, filePath);
  // data, workSheetColumnNames, workSheetName, filePath

  response.status(200).send(data);

  EXPLICAÇÃO DA GAMBIARRA ACIMA: Quando eu usava o .map em dados, 
  ou Ativou ou qualquer outra variavel que contesse os ativos pra buscar a informação de doses no banco de dados 
  a quantidade de requisições era tão grande que o javascript não conseguia esperar 
  o Await da query e devolvia o array incompleto, tentei fixar de varias formas o 
  problema mas sem sucesso e por isso precisei programar como um chimpanzé acima, 
  sito muito ;) 
}
}*/
