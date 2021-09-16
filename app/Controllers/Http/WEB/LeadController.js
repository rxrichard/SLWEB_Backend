"use strict";

const Database = use("Database");
const { seeToken } = require("../../../POG/index");
const moment = require("moment");

class LeadController {
  async Show({ request, response }) {
    try {
      const token = request.header("authorization");

      const verified = seeToken(token);

      //da o vencimento aos contatos vencidos
      // await Database.raw(
<<<<<<< HEAD
      //   "update dbo.LeadsAttr set Ativo = 0, Expirou = 1, Motivo = 'Expirou', DataFechamento = GETDATE() where GETDATE() > DATEADD(HH, (select ParamVlr as MaxHoras from dbo.Parametros where ParamId = 'LeadMaxHoras'), DataHora) AND Ativo = 1"
=======
      //   "update dbo.LeadsAttr set Ativo = 0, Expirou = 1, DataFechamento = GETDATE() where GETDATE() > DATEADD(HH, (select ParamVlr as MaxHoras from dbo.Parametros where ParamId = 'LeadMaxHoras'), DataHora) AND Ativo = 1"
>>>>>>> 06e7de08b7eef7a0e6446204afd76773aa430790
      // );

      //busca leads disponiveis
      const LeadsGeral = await Database.raw(
<<<<<<< HEAD
        "select L.Id, L.Nome_Fantasia, L.Razao_Social, L.Estado, L.Municipio, L.AtividadeDesc, L.Mensagem, L.Insercao from (select * from dbo.Leads as L left join (select LeadId, COUNT(GrpVen) as Atribuicoes from dbo.LeadsAttr where Ativo = 1 group by LeadId) as C on L.Id = C.LeadId left join (select ParamVlr as MaxAtribuicoes from dbo.Parametros where ParamId = 'LeadMax') as P on P.MaxAtribuicoes <> 0 where Atribuicoes IS NULL OR Atribuicoes < MaxAtribuicoes and L.Disponivel = 1) as L inner join dbo.FilialEntidadeGrVenda as F on F.A1_GRPVEN = ? where L.Id not in (select LeadId from dbo.LeadsAttr where GrpVen = ? group by LeadId) and L.Insercao <= (SELECT DATETIMEFROMPARTS(DATEPART(YY, GETDATE()),DATEPART(MM, GETDATE()), DATEPART(DD, GETDATE()), (select top(1) ParamVlr from dbo.Parametros where ParamId = 'LeadLiberacaoHora'), 00, 00, 000)) and F.UF = L.Estado order by L.Insercao DESC",
=======
        "select L.Id, L.Nome_Fantasia, L.Razao_Social, L.Estado, L.Municipio, L.AtividadeDesc, L.Mensagem, L.Insercao from (select * from dbo.Leads as L left join (select LeadId, COUNT(GrpVen) as Atribuicoes from dbo.LeadsAttr where Ativo = 1 group by LeadId) as C on L.Id = C.LeadId left join (select ParamVlr as MaxAtribuicoes from dbo.Parametros where ParamId = 'LeadMax') as P on P.MaxAtribuicoes <> 0 where Atribuicoes IS NULL OR Atribuicoes < MaxAtribuicoes and L.Disponivel = 1) as L inner join dbo.FilialEntidadeGrVenda as F on F.A1_GRPVEN = ? where L.Id not in (select LeadId from dbo.LeadsAttr where GrpVen = ? group by LeadId) and L.Insercao <= (SELECT DATETIMEFROMPARTS(DATEPART(YY, GETDATE()),DATEPART(MM, GETDATE()), DATEPART(DD, GETDATE()), (select top(1) ParamVlr from dbo.Parametros where ParamId = 'LeadLiberacaoHora'), 00, 00, 000)) and (F.UF = L.Estado OR F.M0_CODFIL = '0201' OR F.M0_CODFIL = '0203') order by L.Insercao DESC",
>>>>>>> 06e7de08b7eef7a0e6446204afd76773aa430790
        [verified.grpven, verified.grpven]
      );

      //busca leads assumidos pelo franqueado
      const LeadsFranqueado = await Database.raw(
        "select L.Id, L.Nome_Fantasia, L.Razao_Social, L.Estado, L.Municipio, L.AtividadeDesc, L.Mensagem, L.Contato, L.Fone_1, L.Fone_2, L.Email, A.DataHora, A.Ativo, A.DataFechamento, L.Insercao from dbo.Leads as L inner join dbo.LeadsAttr as A on L.Id = A.LeadId where A.GrpVen = ? and (A.Ativo = 1 or (A.Ativo = 0 and A.DataFechamento >= (SELECT DATETIMEFROMPARTS(DATEPART(YY, GETDATE()),DATEPART(MM, GETDATE()), DATEPART(DD, GETDATE()), (select top(1) ParamVlr from dbo.Parametros where ParamId = 'LeadLiberacaoHora'), 00, 00, 000))))",
        [verified.grpven]
      );

<<<<<<< HEAD
      //Busca quantas tentativar o cara ainda tem de assumir um lead
=======
>>>>>>> 06e7de08b7eef7a0e6446204afd76773aa430790
      const Limites = await Database.raw(
        "select * from (select COUNT(GrpVen) as Tentativas from dbo.LeadsAttr where GrpVen = ? and (Ativo = 1 or (Ativo = 0 and DataFechamento >= (SELECT DATETIMEFROMPARTS(DATEPART(YY, GETDATE()),DATEPART(MM, GETDATE()), DATEPART(DD, GETDATE()), (select top(1) ParamVlr from dbo.Parametros where ParamId = 'LeadLiberacaoHora'), 00, 00, 000))))) as A join (select ParamVlr as MaxTentativas from dbo.Parametros where ParamId = 'LeadMaxFilial') as P on P.MaxTentativas >= 0 join (select ParamVlr as MaxHoras from dbo.Parametros where ParamId = 'LeadMaxHoras') as J on J.MaxHoras >= 0",
        [verified.grpven]
      );

      response.status(200).send({ LeadsGeral, LeadsFranqueado, Limites });
    } catch (err) {
<<<<<<< HEAD
      response.status(400).send();
=======
      response.status(400).send("Erro");
>>>>>>> 06e7de08b7eef7a0e6446204afd76773aa430790
    }
  }

  async See({ request, response, params }){
    const token = request.header("authorization");
    const LeadId = params.lead

    try{
      const verified = seeToken(token);

      const historico = await Database.raw('select LeadId, Motivo, DataFechamento from dbo.LeadsAttr where Desistiu = 1 and LeadId = ? order by DataFechamento DESC', [LeadId])
      

      response.status(200).send(historico)
    }catch(err){
      response.status(400).send()
    }
  }

  async Update({ request, response }) {
    const { ID, type, motivo } = request.only(["ID", "type", "motivo"]);
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      if (type === "hold") {
        const Limites = await Database.raw(
          "select COUNT(L.GrpVen) as Tentativas, P.ParamVlr as MaxTentativas from dbo.LeadsAttr as L inner join dbo.Parametros as P on P.ParamId = 'LeadMaxFilial' where L.GrpVen = ? and (L.Ativo = 1 or (L.Ativo = 0 and L.DataFechamento >= (SELECT DATETIMEFROMPARTS(DATEPART(YY, GETDATE()),DATEPART(MM, GETDATE()), DATEPART(DD, GETDATE()), (select top(1) ParamVlr from dbo.Parametros where ParamId = 'LeadLiberacaoHora'), 00, 00, 000)))) group by P.ParamVlr",
          [verified.grpven]
        );

        if (
          typeof Limites[0] != "undefined" &&
          Limites[0].Tentativas >= Limites[0].MaxTentativas
        ) {
          response.status(401).send();
        } else {
          await Database.raw('IF NOT EXISTS (select * from dbo.LeadsAttr where LeadId = ? AND Ativo = 1) INSERT INTO dbo.LeadsAttr (LeadId, Filial, GrpVen) VALUES (?, ?, ?)', 
          [ID, ID, verified.user_code, verified.grpven])

<<<<<<< HEAD
          const endereco = await Database.raw('select Contato, Fone_1, Fone_2, Email, Mensagem from dbo.Leads as L inner join dbo.LeadsAttr as A on L.Id = A.LeadId where L.Id = ? and A.GrpVen = ? and A.Ativo = 1',
=======
          const endereco = await Database.raw('select Contato, Fone_1, Fone_2, Email from dbo.Leads as L inner join dbo.LeadsAttr as A on L.Id = A.LeadId where L.Id = ? and A.GrpVen = ? and A.Ativo = 1',
>>>>>>> 06e7de08b7eef7a0e6446204afd76773aa430790
          [ID, verified.grpven])

          if (endereco.length > 0) {
            response.status(200).send(endereco);
          } else {
            throw new Error(409);
          }
        }
      } else if (type === "release") {
        moment.locale("pt-br");
        await Database.table("dbo.LeadsAttr")
          .where({
            GrpVen: verified.grpven,
            LeadId: ID,
          })
          .update({
            Ativo: false,
            Desistiu: true,
            Motivo: motivo,
            DataFechamento: moment().subtract(3, "hours").toDate(),
          });

        response.status(200).send();
      } else if (type === 'confirm'){
        moment.locale("pt-br");
        await Database.table("dbo.LeadsAttr")
          .where({
            GrpVen: verified.grpven,
            LeadId: ID,
          })
          .update({
            Ativo: false,
            Desistiu: false,
            Negociacao: true,
            Motivo: motivo,
            DataFechamento: moment().subtract(3, "hours").toDate(),
          });

        response.status(200).send();
      }
    } catch (err) {
      response.status(409).send();
    }
  }

  async Store({ request, response }) {
    const token = request.header("authorization");
    const { lead } = request.only(["lead"]);

    try {
      const verified = seeToken(token);
      if (verified.role === "Franquia") {
        throw Error;
      }

      await Database.insert({
        Nome_Fantasia: lead.NomeFantasia,
        Razao_Social: lead.RazaoSocial,
        Estado: lead.Estado,
        Municipio: lead.Municipio,
        Contato: lead.Contato,
        Fone_1: lead.Fone1,
        Fone_2: lead.Fone2,
        Email: lead.Email,
        AtividadeDesc: lead.Desc,
<<<<<<< HEAD
        Mensagem: lead.Msg,
=======
>>>>>>> 06e7de08b7eef7a0e6446204afd76773aa430790
        Disponivel: true,
      }).into("dbo.Leads");

      response.status(201).send("Ok");
    } catch (err) {
      response.status(400).send();
    }
  }
}

module.exports = LeadController;
