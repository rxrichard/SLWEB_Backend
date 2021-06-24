"use strict";

const Database = use("Database");
const Helpers = use("Helpers");
const Drive = use("Drive");
const Mail = use("Mail");
const Env = use("Env");

const { seeToken, dateCheck } = require("../../../POG/index");

class FuturoFranqueadoController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = await seeToken(token);

      if (verified.role === "Franquia") throw Error;

      const formularios = await Database.select("*").from("dbo.FuturaFranquia");

      response.status(200).send(formularios);
    } catch (err) {
      response.status(400).send();
    }
  }

  async FutureCod({ request, response }) {
    const { cod } = request.only(["cod"]);

    try {
      const resposta = await Database.select("*")
        .from("dbo.FuturaFranquia")
        .where({
          CodCandidato: cod,
          PREENCHIDO: 0,
        });

      if (resposta.length === 0) {
        throw Error;
      }

      response.status(200).send("ok");
    } catch (err) {
      response
        .status(400)
        .send("nenhum candidato à franquia encontraco com o código fornecido");
    }
  }

  async RequestCod({ request, response }) {
    const { email } = request.only(["email"]);
    try {
      //crio um numero aleatório de 6 posições
      const cod = Math.random().toString().slice(2, 8);

      await Database.insert({
        CodCandidato: cod,
        Email: email
      }).into('dbo.FuturaFranquia')

      await Mail.send(
          "emails.CodForm",
          { Codigo: cod, FRONTEND: Env.get('CLIENT_URL') },
          (message) => {
            message
              .to(email.trim())
              .cc(Env.get("suporte3@slaplic.com.br"))
              .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
              .subject("Código de acesso ao Formulário");
          }
        );

      response.status(201).send('ok');
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async FormUpload({ request, response }) {
    const { form } = request.only(["form"]);
    const candidato = request.header("proto-cod");

    try {
      let estado_civil;

      switch (Number(form.Est_Civil)) {
        case 1:
          estado_civil = "Casado(Comunhão Universal)";
          break;
        case 2:
          estado_civil = "Casado(Comunhão Parcial)";
          break;
        case 3:
          estado_civil = "Casado(Separação Total)";
          break;
        case 4:
          estado_civil = "Solteiro(a)";
          break;
        case 5:
          estado_civil = "Divorciado(a)";
          break;
        case 6:
          estado_civil = "Separado Judicialmente";
          break;
        case 7:
          estado_civil = "Viúvo(a)";
          break;
        default:
          estado_civil = "Desconhecido";
          break;
      }

      //tem que trocar isso aqui pra update com base no número do candidato
      const resposta = await Database.table("dbo.FuturaFranquia")
        .where({ CodCandidato: candidato })
        .update({
          PREENCHIDO: 1,
          DtPreenchimento: dateCheck(),
          NomeCompleto: form.Nome_Completo,
          DtNascimento: form.DtNascimento,
          RG: form.RG,
          CPF: form.CPF,
          Logradouro: form.Logradouro,
          Número: form.Número,
          Complemento: form.Complemento,
          Bairro: form.Bairro,
          Municipio: form.Municipio,
          Estado: form.Estado,
          CEP: form.CEP,
          Email: form.Email,
          TelResidencial: form.Tel_Residencial,
          Celular: form.Celular,
          EstCivil: estado_civil,
          NomeConj: form.Conj_Nome,
          DtNascConj: form.Conj_DtNascimento,
          TempoUni: form.TUnião,
          CPFConj: form.Conj_CPF,
          RGConj: form.Conj_RG,
          RendMenConj: form.Conj_RendMensal,
          CLT: form.CLT,
          RendMensal: form.Rend_Mensal,
          PFilhos: form.Tem_filhos,
          QFilhos: form.Qtd_filhos,
          IFilhos: form.Idd_filhos,
          TResidencia: form.T_Residencia,
          ValResidencia: form.Residencia_Mensal,
          PVeiculo: form.P_Veiculo,
          PImovel: form.P_Imovel,
          ExpectRetorno: form.Expect,
          PRecolhimento: form.Recolhimento,
          QRecolhimento: form.Recolhimento_QTD,
          OrigemCapital: form.Origem_Capital,
          RendaFamiliar: form.Renda_Familiar,
          CRendaFamiliar: form.Renda_Composta,
          DispInvest: form.Disp_Invest,
          TEmpresaExp: form.T_Empresa,
          EspcEmpresa: form.Detalhes_Atividade,
          FormEscolar: form.Form_Escolar,
          UltExp: form.Ult_exp,
          HavSociedade: form.Sociedade,
          NomeSocio: form.Nome_Socio,
          VincSocio: form.Socio_Vinculo,
          TempConhece: form.Tempo_ConheceSocio,
          Realizacoes: form.Realizou_Socio,
          TSocio: form.Cond_Socio,
          SocioInvest: form.Part_invest,
          InvestProp: form.Prop_Invest,
          TeveSociedade: form.T_Empreendimento,
          SociedadeExp: form.Exp_Sociedade,
          InvestMenInic: form.Cob_Desp,
          ConhecPilao: form.Conhece_Pilao,
          Notas: form.Prioridade.toString(),
          CaracEscolha: form.Caracteristica_Peso,
          ConcRegras: form.Com_Regra,
          LucroMin: form.Com_Med,
          CompInformar: form.Com_Inf,
        });

      response.status(201).send(resposta);
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async FileUpload({ request, response }) {
    const candidato = request.header("proto-cod");
    const formData = request.file("formData", {
      types: ["image", "pdf"],
      size: "10mb",
    });
    const path = Helpers.publicPath(`/DOCS/${candidato}`);
    let filenames = [];

    try {
      await formData.moveAll(path, (file, i) => {
        let newFileName = `upload-${i}-${new Date().getTime()}.${file.subtype}`;
        filenames.push(newFileName);

        return {
          name: newFileName,
          overwrite: true,
        };
      });

      if (!formData.movedAll()) {
        return formData.errors();
      }

      //Não consigo salvar diretamente na rede(por motivos de tipagem), então salvo na pasta mesmo do servidor e depois copio para o .250
      filenames.map(async (name) => {
        const file = await Drive.get(`${path}/${name}`);
        Drive.put(
          `\\\\192.168.1.250\\dados\\Franquia\\SLWEB\\DOCS\\${candidato}\\${name}`,
          file
        );
      });

      response.status(200).send("ok");
    } catch (err) {
      response.status(400).send();
    }
  }

  //mover isso para outro controller
  async RetriveWORDFORM({ response }) {
    try {
      // PUXO O FORMULÁRIO DA REDE
      const formulario = await Drive.get(
        `\\\\192.168.1.250\\dados\\Franquia\\SLWEB\\QUESTIONARIO_PERFIL_ATUALIZADO.doc`
      );
      response.status(200).send(formulario);

      // PUXO O FORMULARIO NA PASTA PUBLIC
      // const formularioPath = Helpers.publicPath(`QUESTIONARIO_PERFIL_ATUALIZADO.doc`)
      // response.attachment(formularioPath)
    } catch (err) {
      response.status(400).send(err);
    }
  }
}

module.exports = FuturoFranqueadoController;
