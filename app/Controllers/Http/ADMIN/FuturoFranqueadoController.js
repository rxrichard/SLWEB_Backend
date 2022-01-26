"use strict";

const Database = use("Database");
const Helpers = use("Helpers");
const Drive = use("Drive");
const Mail = use("Mail");
const Env = use("Env");
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const toArray = require('stream-to-array')

const { seeToken, dateCheck } = require("../../../POG/jwt");
const { PDFGen } = require("../../../POG/Form_PDFGen");

var fonts = {
  Roboto: {
    normal: Helpers.resourcesPath("fonts/OpenSans-Regular.ttf"),
    bold: Helpers.resourcesPath("fonts/OpenSans-Bold.ttf"),
    italics: Helpers.resourcesPath("fonts/OpenSans-RegularItalic.ttf"),
    bolditalics: Helpers.resourcesPath("fonts/OpenSans-BoldItalic.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

class FuturoFranqueadoController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = await seeToken(token);

      if (verified.role === "Franquia") throw Error;

      const formularios = await Database.select("*").from("dbo.FuturaFranquia").orderBy('DtSolicitacao', 'desc');

      response.status(200).send(formularios);
    } catch (err) {
      response.status(400).send();
    }
  }

  async GeneratePDF({ request, response, params }) {
    const token = request.header("authorization");
    const formcod = params.formcod;
    const path = Helpers.publicPath(`/Forms`);
    const PathWithName = `${path}/${formcod}-${new Date().getTime()}.pdf`;

    try {
      const verified = await seeToken(token);

      if (verified.role === "Franquia") throw Error;

      const Form = await Database
        .select("*")
        .from("dbo.FuturaFranquia")
        .where({
          CodCandidato: formcod,
        })

      const PDFModel = PDFGen(Form[0]);

      var pdfDoc = printer.createPdfKitDocument(PDFModel);
      pdfDoc.pipe(fs.createWriteStream(PathWithName));
      pdfDoc.end();

      const enviarDaMemóriaSemEsperarSalvarNoFS = await toArray(pdfDoc).then(parts => {
        return Buffer.concat(parts);
      })

      response.status(200).send(enviarDaMemóriaSemEsperarSalvarNoFS);
    } catch (err) {
      response.status(400).send(err);
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
          NomeCompleto: String(form.Nome_Completo).slice(0, 250),
          DtNascimento: String(form.DtNascimento).slice(0, 250),
          RG: String(form.RG).slice(0, 250),
          CPF: String(form.CPF).slice(0, 250),
          Logradouro: String(form.Logradouro).slice(0, 250),
          Número: String(form.Número).slice(0, 250),
          Complemento: String(form.Complemento).slice(0, 250),
          Bairro: String(form.Bairro).slice(0, 250),
          Municipio: String(form.Municipio).slice(0, 250),
          Estado: String(form.Estado).slice(0, 250),
          CEP: String(form.CEP).slice(0, 250),
          Email: String(form.Email).slice(0, 250),
          TelResidencial: String(form.Tel_Residencial).slice(0, 250),
          Celular: String(form.Celular).slice(0, 250),
          EstCivil: String(estado_civil).slice(0, 250),
          NomeConj: String(form.Conj_Nome).slice(0, 250),
          DtNascConj: String(form.Conj_DtNascimento).slice(0, 250),
          TempoUni: String(form.TUnião).slice(0, 250),
          CPFConj: String(form.Conj_CPF).slice(0, 250),
          RGConj: String(form.Conj_RG).slice(0, 250),
          RendMenConj: String(form.Conj_RendMensal).slice(0, 250),
          CLT: String(form.CLT).slice(0, 250),
          RendMensal: String(form.Rend_Mensal).slice(0, 250),
          PFilhos: String(form.Tem_filhos).slice(0, 250),
          QFilhos: String(form.Qtd_filhos).slice(0, 250),
          IFilhos: String(form.Idd_filhos).slice(0, 250),
          TResidencia: String(form.T_Residencia).slice(0, 250),
          ValResidencia: String(form.Residencia_Mensal).slice(0, 250),
          PVeiculo: String(form.P_Veiculo).slice(0, 250),
          PImovel: String(form.P_Imovel).slice(0, 250),
          ExpectRetorno: String(form.Expect).slice(0, 250),
          PRecolhimento: String(form.Recolhimento).slice(0, 250),
          QRecolhimento: String(form.Recolhimento_QTD).slice(0, 250),
          OrigemCapital: String(form.Origem_Capital).slice(0, 250),
          RendaFamiliar: String(form.Renda_Familiar).slice(0, 250),
          CRendaFamiliar: String(form.Renda_Composta).slice(0, 250),
          DispInvest: String(form.Disp_Invest).slice(0, 250),
          TEmpresaExp: String(form.T_Empresa).slice(0, 250),
          EspcEmpresa: String(form.Detalhes_Atividade).slice(0, 250),
          FormEscolar: String(form.Form_Escolar).slice(0, 250),
          UltExp: String(form.Ult_exp).slice(0, 250),
          HavSociedade: String(form.Sociedade).slice(0, 250),
          NomeSocio: String(form.Nome_Socio).slice(0, 250),
          VincSocio: String(form.Socio_Vinculo).slice(0, 250),
          TempConhece: String(form.Tempo_ConheceSocio).slice(0, 250),
          Realizacoes: String(form.Realizou_Socio).slice(0, 250),
          TSocio: String(form.Cond_Socio).slice(0, 250),
          SocioInvest: String(form.Part_invest).slice(0, 250),
          InvestProp: String(form.Prop_Invest).slice(0, 250),
          TeveSociedade: String(form.T_Empreendimento).slice(0, 250),
          SociedadeExp: String(form.Exp_Sociedade).slice(0, 250),
          InvestMenInic: String(form.Cob_Desp).slice(0, 250),
          ConhecPilao: String(form.Conhece_Pilao).slice(0, 250),
          Notas: form.Prioridade.toString(),
          CaracEscolha: String(form.Caracteristica_Peso).slice(0, 250),
          ConcRegras: String(form.Com_Regra).slice(0, 250),
          LucroMin: String(form.Com_Med).slice(0, 250),
          CompInformar: String(form.Com_Inf).slice(0, 250),
          Consultor: String(form.Consultor).slice(0, 50),
        });

        await Mail.send(
          "emails.FormFranquiaPreenchido",
          { Destinatario: String(form.Nome_Completo).split(" ")[0] },
          (message) => {
            message
              .to(String(form.Email).slice(0, 250))
              .cc(Env.get("suporte3@slaplic.com.br"))
              .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
              .subject("Formulário de Franquia preenchido")
              .attach('X:\\Franquia\\EXPANSÃO DE FRANQUIAS\\Consultor\\COF - SL CAFÉS - PILÃO PROFESSIONAL 2022.pdf', {
                filename: 'COF Pilão Professional.pdf'
              })
          }
        );

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

      response.status(200).send("Arquivos Salvos");
    } catch (err) {
      response.status(200).send("Falha ao salvar arquivos");
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
