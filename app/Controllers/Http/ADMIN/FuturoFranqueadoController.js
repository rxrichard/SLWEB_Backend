"use strict";

const Database = use("Database");
const Helpers = use("Helpers");
const Drive = use("Drive");
const Mail = use("Mail");
const Env = use("Env");
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const toArray = require('stream-to-array')
const logger = require("../../../../dump/index")
const { seeToken, dateCheck } = require("../../../Services/jwtServices");
const { PDFGen } = require("../../../../resources/pdfModels/perfilFranqueadoForm_pdfModel");

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

      if (verified.role === "Franquia") {
        throw new Error('Usuário não autorizado');
      }

      const formularios = await Database
        .select("*")
        .from("dbo.FuturaFranquia")
        .where({
          PREENCHIDO: true
        }).orderBy('DtSolicitacao', 'desc');

      response.status(200).send(formularios);
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'FuturoFranqueadoController.Show',
      })
    }
  }

  async GeneratePDF({ request, response, params }) {
    const token = request.header("authorization");
    const CodCandidato = params.CodCandidato;
    const path = Helpers.publicPath(`/tmp`);
    const PathWithName = `${path}/${CodCandidato}-${new Date().getTime()}.pdf`;

    try {
      const verified = await seeToken(token);

      if (verified.role === "Franquia") throw Error;

      const Form = await Database
        .select("*")
        .from("dbo.FuturaFranquia")
        .where({
          CodCandidato: CodCandidato,
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
      response.status(400).send();
      logger.error({
        token: token,
        params: params,
        payload: request.body,
        err: err,
        handler: 'FuturoFranqueadoController.GeneratePDF',
      })
    }
  }

  async FutureCod({ request, response, params }) {
    const cod = params.cod

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
      response.status(400).send();
      logger.error({
        token: null,
        params: params,
        payload: request.body,
        err: err,
        handler: 'FuturoFranqueadoController.FutureCod',
      })
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
            .cc([
              Env.get("EMAIL_COMERCIAL_2"),
              Env.get("EMAIL_COMERCIAL_3"),
              Env.get("EMAIL_SUPORTE"),
            ])
            .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
            .subject("Código de acesso ao Formulário");
        }
      );

      response.status(201).send('ok');
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: null,
        params: null,
        payload: request.body,
        err: err,
        handler: 'FuturoFranqueadoController.RequestCod',
      })
    }
  }

  async FormUpload({ request, response, params }) {
    const { form } = request.only(["form"]);
    const candidato = params.CodCandidato;
    const path = Helpers.publicPath(`/tmp`);
    const PathWithName = `${path}/${candidato}-${new Date().getTime()}.pdf`;

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
          EstCivil: estado_civil,
          NomeConj: String(form.Conj_Nome).slice(0, 250),
          DtNascConj: String(form.Conj_DtNascimento).slice(0, 250),
          TempoUni: String(form.TUnião).slice(0, 250),
          CPFConj: String(form.Conj_CPF).slice(0, 250),
          RGConj: String(form.Conj_RG).slice(0, 250),
          RendMenConj: String(form.Conj_RendMensal).slice(0, 250),
          CLT: form.CLT,
          RendMensal: String(form.Rend_Mensal).slice(0, 250),
          PFilhos: String(form.Tem_filhos).slice(0, 250),
          QFilhos: String(form.Qtd_filhos).slice(0, 250),
          IFilhos: form.Idd_filhos,
          TResidencia: form.T_Residencia,
          ValResidencia: String(form.Residencia_Mensal).slice(0, 250),
          PVeiculo: form.P_Veiculo,
          PImovel: form.P_Imovel,
          ExpectRetorno: form.Expect,
          PRecolhimento: form.Recolhimento,
          QRecolhimento: String(form.Recolhimento_QTD).slice(0, 250),
          OrigemCapital: String(form.Origem_Capital).slice(0, 250),
          RendaFamiliar: String(form.Renda_Familiar).slice(0, 250),
          CRendaFamiliar: String(form.Renda_Composta).slice(0, 250),
          DispInvest: String(form.Disp_Invest).slice(0, 250),
          TEmpresaExp: form.T_Empresa,
          EspcEmpresa: String(form.Detalhes_Atividade).slice(0, 250),
          FormEscolar: String(form.Form_Escolar).slice(0, 250),
          UltExp: String(form.Ult_exp).slice(0, 250),
          HavSociedade: form.Sociedade,
          NomeSocio: String(form.Nome_Socio).slice(0, 250),
          VincSocio: String(form.Socio_Vinculo).slice(0, 250),
          TempConhece: String(form.Tempo_ConheceSocio).slice(0, 250),
          Realizacoes: String(form.Realizou_Socio).slice(0, 250),
          TSocio: String(form.Cond_Socio).slice(0, 250),
          SocioInvest: form.Part_invest,
          InvestProp: String(form.Prop_Invest).slice(0, 250),
          TeveSociedade: form.T_Empreendimento,
          SociedadeExp: String(form.Exp_Sociedade).slice(0, 250),
          InvestMenInic: form.Cob_Desp,
          ConhecPilao: String(form.Conhece_Pilao).slice(0, 250),
          Notas: form.Prioridade.toString(),
          CaracEscolha: String(form.Caracteristica_Peso).slice(0, 250),
          ConcRegras: form.Com_Regra,
          LucroMin: form.Com_Med,
          CompInformar: form.Com_Inf,
          Consultor: form.Consultor,
        });

      await Mail.send(
        "emails.FormFranquiaPreenchidoFF",
        { Destinatario: String(form.Nome_Completo).split(" ")[0] },
        (message) => {
          message
            .to(String(form.Email).slice(0, 250))
            .cc(Env.get("EMAIL_SUPORTE"))
            .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
            .subject("Formulário de Franquia recebido")
        }
      );

      let emailConsultor = null

      switch (form.Consultor) {
        case 'Alessandro':
          emailConsultor = 'alessandro.pinheiro@pilaoprofessional.com.br'
          break;
        case 'Kauê':
          emailConsultor = 'kaue.santos@pilaoprofessional.com.br'
          break;
        case 'Priscila':
          emailConsultor = 'priscila.mattos@pilaoprofessional.com.br'
          break;
        case 'Richard':
          emailConsultor = 'richard.bastos@pilaoprofessional.com.br'
          break;
        case 'Tatiane':
          emailConsultor = 'tatiane.silva@pilaoprofessional.com.br'
          break;
        default:
          emailConsultor = null
          break;
      }

      const Form = await Database
        .select("*")
        .from("dbo.FuturaFranquia")
        .where({
          CodCandidato: candidato,
        })

      const PDFModel = PDFGen(Form[0]);

      var pdfDoc = printer.createPdfKitDocument(PDFModel);
      pdfDoc.pipe(fs.createWriteStream(PathWithName));
      pdfDoc.end();

      if (emailConsultor !== null) {
        await Mail.send(
          "emails.FormFranquiaPreenchidoConsultor",
          {
            Consultor: form.Consultor,
            INTERESSADO: String(form.Nome_Completo).split(" ")[0],
            Frontend: Env.get('CLIENT_URL')
          },
          (message) => {
            message
              .to(emailConsultor)
              .cc(Env.get("EMAIL_SUPORTE"))
              .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
              .subject("Formulário de Franquia preenchido")
              .attach(PathWithName, {
                filename: `Formulário de Perfil_${candidato}.pdf`,
              })
          }
        );
      }

      response.status(201).send(resposta);
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: null,
        params: params,
        payload: request.body,
        err: err,
        handler: 'FuturoFranqueadoController.FormUpload',
      })
    }
  }

  async FileUpload({ request, response }) {
    const COD = request.input('cod')
    const MULTI = request.input('multiple')
    const formData = request.file("formData", {
      types: ["image", "pdf"],
      size: "10mb",
    });
    const path = Helpers.publicPath(`/DOCS/${COD}`);
    let newFileName = ''
    let filenames = [];
    let file = null

    try {
      
      if (MULTI === 'N') {

        newFileName = `upload-SINGLE-${new Date().getTime()}.${formData.subtype}`;

        await formData.move(path, {
          name: newFileName,
          overwrite: true,
        });

        if (!formData.moved()) {
          return formData.errors();
        }

        file = await Drive.get(`${path}/${newFileName}`);

        Drive.put(
          `\\\\192.168.1.250\\dados\\Franquia\\SLWEB\\DOCS\\${candidato}\\${newFileName}`,
          file
        );
      } else {
        await formData.moveAll(path, (file, i) => {
          newFileName = `upload-${i + 1}-${new Date().getTime()}.${file.subtype}`;
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
            `\\\\192.168.1.250\\dados\\Franquia\\SLWEB\\DOCS\\${candidato}\\${name}`,
            file
          );
        });
      }

      response.status(200).send("Arquivos Salvos");
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: null,
        params: null,
        payload: request.body,
        err: err,
        handler: 'FuturoFranqueadoController.FileUpload',
      })
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
      response.status(400).send();
      logger.error({
        token: null,
        params: null,
        payload: null,
        err: err,
        handler: 'FuturoFranqueadoController.RetriveWORDFORM',
      })
    }
  }
}

module.exports = FuturoFranqueadoController;
