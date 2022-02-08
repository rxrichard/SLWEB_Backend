const Helpers = use("Helpers");

exports.PDFGen = (Form) => {
  //obj que vai virar pdf
  var docDefinition = {
    // watermark: Helpers.resourcesPath("logo/Exemplo logo pilao - Danfe.bmp"),
    content: [
      { text: "Formulário de interesse", style: "header" },
      {
        image: Helpers.resourcesPath("logo/Exemplo logo pilao - Danfe.bmp"),
        width: 100,
        absolutePosition: { x: 460, y: 10 },
      },
      {
        unbreakable: true,
        stack: [{
          columns: [GetPart1(Form), GetPart3(Form)],
        }]
      },
      {
        unbreakable: true,
        stack: [{
          columns: [GetPart2(Form), GetPart4(Form)],
        }]
      },
      {
        unbreakable: true,
        stack: [{
          columns: [
            GetPart6(Form),
            [
              { text: 'Consultor referência', style: "subheader" },
              {
                width: '50%',
                margin: [0, 5, 0, 0],
                text: Form.Consultor === '' || Form.Consultor === null ? 'Não informado' : Form.Consultor,
              }
            ]
          ],
        }]
      },
      {
        unbreakable: true,
        stack: [{
          columns: [GetPart5(Form)],
        }]
      },
      {
        unbreakable: true,
        stack: [{
          columns: [Frases2Array(Form)]
        }]
      }
    ],
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5],
      },
    },
  };

  return docDefinition;
};

const GetPart1 = (Form) => {
  return [
    { text: 'Dados Pessoais', style: "subheader" },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Nome completo: ${Form.NomeCompleto}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Data de nascimento: ${Form.DtNascimento}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `RG: ${Form.RG}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `CPF: ${Form.CPF}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Logradouro: ${Form.Logradouro}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Número: ${Form.Número}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Complemento: ${Form.Complemento}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Bairro: ${Form.Bairro}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Município: ${Form.Municipio}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Estado: ${Form.Estado}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `CEP: ${Form.CEP}`
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Email: ${Form.Email}`
    },
    Form.TelResidencial !== null & Form.TelResidencial !== '' ? {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Telefone: ${Form.TelResidencial}`
    } : null
    ,
    Form.Celular !== null & Form.Celular !== '' ? {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Celular: ${Form.Celular}`
    } : null
    ,
  ]
}

const GetPart2 = (Form) => {
  return [
    { text: 'Estado civil e Família', style: "subheader" },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Estado civil: ${Form.EstCivil}`,
    },
    Form.EstCivil !== 'Casado(Comunhão Universal)' && Form.EstCivil !== 'Casado(Comunhão Parcial)' && Form.EstCivil !== 'Casado(Separação Total)' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Nome Conjuge: ${Form.NomeConj}`,
      }
    ,
    Form.EstCivil !== 'Casado(Comunhão Universal)' && Form.EstCivil !== 'Casado(Comunhão Parcial)' && Form.EstCivil !== 'Casado(Separação Total)' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Data de Nascimento: ${Form.DtNascConj}`,
      }
    ,
    Form.EstCivil !== 'Casado(Comunhão Universal)' && Form.EstCivil !== 'Casado(Comunhão Parcial)' && Form.EstCivil !== 'Casado(Separação Total)' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `RG: ${Form.RGConj}`,
      }
    ,
    Form.EstCivil !== 'Casado(Comunhão Universal)' && Form.EstCivil !== 'Casado(Comunhão Parcial)' && Form.EstCivil !== 'Casado(Separação Total)' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `CPF: ${Form.CPFConj}`,
      }
    ,
    Form.EstCivil !== 'Casado(Comunhão Universal)' && Form.EstCivil !== 'Casado(Comunhão Parcial)' && Form.EstCivil !== 'Casado(Separação Total)' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Tempo de União: ${Form.TempoUni}`,
      }
    ,
    Form.EstCivil !== 'Casado(Comunhão Universal)' && Form.EstCivil !== 'Casado(Comunhão Parcial)' && Form.EstCivil !== 'Casado(Separação Total)' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Rendimento Mensal: ${Form.RendMenConj}`,
      }
    ,
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Possui filhos: ${Form.PFilhos}`,
    },
    Form.PFilhos === 'Não' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Número de Filhos: ${Form.QFilhos}`,
      },
    Form.PFilhos === 'Não' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Idade(s) do(s) filho(s): ${Form.IFilhos}`,
      },
  ]
}

const GetPart3 = (Form) => {
  return [
    { text: 'Rendimento e Experiência', style: "subheader" },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Vinculo CLT: ${Form.CLT}`,
    },
    Form.CLT === 'Sim' ?
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Rendimento Mensal: ${Form.RendMensal}`,
      }
      : null
    ,
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Rec. de imposto no último ano: ${Form.PRecolhimento}`,
    },
    Form.PRecolhimento === 'Sim' ?
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Valor do recolhimento: ${Form.QRecolhimento}`,
      }
      : null
    ,
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Origem do capital: ${Form.OrigemCapital}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Renda Familiar: ${Form.RendaFamiliar}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Composição da Renda Familiar: ${Form.CRendaFamiliar}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Total Disponivel para Investimento: ${Form.DispInvest}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Tem/Teve empresa própria e experiência como autônomo: ${Form.TEmpresaExp}`,
    },
    Form.TEmpresaExp === 'Sim' ?
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Detalhes da empresa: ${Form.EspcEmpresa}`,
      }
      : null
    ,
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Formação Escolar: ${Form.FormEscolar}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Últimas experiencias profissionais: ${Form.UltExp}`,
    },
  ]
}

const GetPart4 = (Form) => {
  return [
    { text: 'Sócio', style: "subheader" },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Haverá Sociedade: ${Form.HavSociedade}`,
    },
    Form.HavSociedade === 'Não' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Nome do Sócio: ${Form.NomeSocio}`,
      }
    ,
    Form.HavSociedade === 'Não' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Tipo de Vinculo com Sócio: ${Form.VincSocio}`,
      }
    ,
    Form.HavSociedade === 'Não' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `A quanto tempo se conhecem: ${Form.TempConhece}`,
      }
    ,
    Form.HavSociedade === 'Não' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `O que já realizaram juntos: ${Form.Realizacoes}`,
      }
    ,
    Form.HavSociedade === 'Não' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Tipo de Sócio: ${Form.TSocio}`,
      }
    ,
    Form.HavSociedade === 'Não' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Sócio participará do investimento: ${Form.SocioInvest}`,
      }
    ,
    Form.HavSociedade === 'Não' && (Form.SocioInvest === 'Não' || Form.SocioInvest === 'null' || Form.SocioInvest === null) ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Proporção de participação: ${Form.InvestProp}`,
      }
    ,
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Já teve empreendimento em sociedade: ${Form.TeveSociedade}`,
    },
    Form.TeveSociedade === 'Não' ? null :
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Como foi a experiencia: ${Form.SociedadeExp}`,
      }
  ]
}

const GetPart5 = (Form) => {
  return [
    { text: 'Franquia', style: "subheader" },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Expectativa de retorno: ${Form.ExpectRetorno} meses`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Existe disponibilidade de capital para um eventual
      investimento parcial mensal que complemente as despesas da
      franquia: ${Form.InvestMenInic}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Como conheceu a Pilão Professional: ${Form.ConhecPilao}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Qual característica do negócio mais pesou na escolha da Pilão
      Professional: ${Form.CaracEscolha}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Está disposto(a) a cumprir as regras estabelecidas pela
      franqueadora: ${Form.ConcRegras}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Está preparado para os primeiros meses com baixa média de
      retorno: ${Form.LucroMin}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Se compromete a informar a franqueadora sobre o que for
      solicitado: ${Form.CompInformar}`,
    },
  ]
}

const GetPart6 = (Form) => {
  return [
    { text: 'Bens', style: "subheader" },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Residencia: ${Form.TResidencia}`,
    },
    Form.TResidencia === 'Alugada' || Form.TResidencia === 'Financiada' ?
      {
        width: '50%',
        margin: [0, 5, 0, 0],
        text: `Custo mensal: ${Form.ValResidencia}`,
      }
      : null
    ,
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Possui Veículo: ${Form.PVeiculo}`,
    },
    {
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `Possui Imóvel: ${Form.PImovel}`,
    },
  ]
}

const Frases2Array = (Form) => {
  const auxArray = [];
  const prioridadesArrayFromString = String(Form.Notas).split(',')

  auxArray.push({ text: 'Prioridades', style: "subheader" })

  afirmacoes.forEach((afirmacao, index) => {
    auxArray.push({
      width: '50%',
      margin: [0, 5, 0, 0],
      text: `(${prioridadesArrayFromString[index]}) ${afirmacao}`
    })
  })

  return auxArray
}

const afirmacoes = [
  'Serviço de apoio prestado da franqueadora.',
  'Investimento. A equação financeira entre o quanto é investido e o tempo que demora e haver o retorno desse valor.',
  'Status. Reconhecimento social que ganhará tornando-se um franqueado Pilão Professional.',
  'Afinidade com a marca Pilão.',
  'Lucratividade. Quanto é o potencial de lucro mensal.',
  'Segurança e solidez. Garantidas pelos fatos de ser uma empresa líder no segmento.',
  'Afinidade com o produto café.',
  'Pelos conceitos, valores e cultura (transparência, afetividade, seriedade, etc); percebidos durante o processo de conhecimento da franquia.',
  'Força comercial da marca. Pelo tanto que a marca é conhecida pelo consumidor, faz propagandas e terá capacidade de gerar vendas nas unidades franqueadas.',
  'Indicação de um amigo ou conhecido.',
  'Referências positivas de franqueado(s) da rede Pilão Professional.',
]