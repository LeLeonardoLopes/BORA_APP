import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_shading(cell, color_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()

    # Configuração de Margens (ABNT: Superior 3cm, Esquerda 3cm, Inferior 2cm, Direita 2cm)
    for section in doc.sections:
        section.top_margin = Inches(1.18)    # 3.0 cm
        section.left_margin = Inches(1.18)   # 3.0 cm
        section.bottom_margin = Inches(0.79) # 2.0 cm
        section.right_margin = Inches(0.79)  # 2.0 cm

    # Estilos Base
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Arial'
    style_normal.font.size = Pt(12)
    style_normal.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    style_normal.paragraph_format.line_spacing = 1.5
    style_normal.paragraph_format.space_after = Pt(6)

    primary_color = RGBColor(0x00, 0x66, 0xFF) # Azul Bora!
    dark_slate = RGBColor(0x1E, 0x29, 0x3B)

    # ----------------------------------------------------
    # CAPA OFICIAL FATEC FRANCA
    # ----------------------------------------------------
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("CENTRO PAULA SOUZA\nFACULDADE DE TECNOLOGIA DE FRANCA\n“Dr. THOMAZ NOVELINO”\n\nTECNOLOGIA EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS")
    r.bold = True
    r.font.size = Pt(13)

    doc.add_paragraph().paragraph_format.space_before = Pt(50)

    # Alunos (Nomes Corretos e Oficiais)
    p_alunos = doc.add_paragraph()
    p_alunos.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_alunos = p_alunos.add_run("RENATA SARAIVA CLAUDINO\nLEONARDO LOPES DOS SANTOS")
    r_alunos.bold = True
    r_alunos.font.size = Pt(13)

    doc.add_paragraph().paragraph_format.space_before = Pt(70)

    # Título e Subtítulo
    p_tit = doc.add_paragraph()
    p_tit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_tit = p_tit.add_run("BORA! APP — SOCIAL TECH DE CONEXÃO ESPORTIVA, REPUTAÇÃO MÚTUA, GESTÃO DE AMISTOSOS, SEGURANÇA FEMININA & COMPLIANCE ÉTICO")
    r_tit.bold = True
    r_tit.font.size = Pt(14)
    r_tit.font.color.rgb = primary_color

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Plataforma com Reputação Multidimensional 360°, Súmulas Digitais, Arbitragem Qualificada, Espaço Seguro para Mulheres e Canal de Denúncias contra a Discriminação")
    r_sub.font.size = Pt(11)
    r_sub.italic = True

    doc.add_paragraph().paragraph_format.space_before = Pt(60)

    # Nota de Apresentação ABNT
    table_nota = doc.add_table(rows=1, cols=2)
    table_nota.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_vazia, cell_nota = table_nota.rows[0].cells
    cell_vazia.width = Inches(3.2)
    cell_nota.width = Inches(3.5)

    p_nota = cell_nota.paragraphs[0]
    p_nota.paragraph_format.line_spacing = 1.0
    p_nota.paragraph_format.space_after = Pt(4)
    r_nota = p_nota.add_run(
        "Trabalho de Graduação apresentado à Faculdade de Tecnologia de Franca - “Dr. Thomaz Novelino”, "
        "como parte dos requisitos obrigatórios para obtenção do título de Tecnólogo em Análise e Desenvolvimento de Sistemas."
    )
    r_nota.font.size = Pt(10)

    p_orient = cell_nota.add_paragraph()
    p_orient.paragraph_format.line_spacing = 1.0
    r_or_label = p_orient.add_run("\nOrientador: ")
    r_or_label.font.size = Pt(10)
    r_or_label.bold = True
    r_or_val = p_orient.add_run("Prof. Me. Carlos Eduardo de França Roland")
    r_or_val.font.size = Pt(10)
    r_or_val.bold = True

    doc.add_paragraph().paragraph_format.space_before = Pt(70)

    p_cidade = doc.add_paragraph()
    p_cidade.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cid = p_cidade.add_run("FRANCA/SP\n2026")
    r_cid.bold = True
    r_cid.font.size = Pt(12)

    doc.add_page_break()

    # ----------------------------------------------------
    # PÁGINA 2: CABEÇALHO DO ARTIGO / TRABALHO & RESUMO
    # ----------------------------------------------------
    p_art_tit = doc.add_paragraph()
    p_art_tit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_at = p_art_tit.add_run("BORA! APP — SOCIAL TECH DE CONEXÃO ESPORTIVA, REPUTAÇÃO MÚTUA, GESTÃO DE AMISTOSOS, SEGURANÇA FEMININA & COMPLIANCE ÉTICO")
    r_at.bold = True
    r_at.font.size = Pt(13)
    r_at.font.color.rgb = primary_color

    p_autores = doc.add_paragraph()
    p_autores.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_aut1 = p_autores.add_run("Renata Saraiva Claudino")
    r_aut1.bold = True
    r_aut1_sup = p_autores.add_run("1; ")
    r_aut1_sup.font.superscript = True

    r_aut2 = p_autores.add_run("Leonardo Lopes dos Santos")
    r_aut2.bold = True
    r_aut2_sup = p_autores.add_run("2; ")
    r_aut2_sup.font.superscript = True

    r_aut3 = p_autores.add_run("Carlos Eduardo de França Roland")
    r_aut3.bold = True
    r_aut3_sup = p_autores.add_run("3")
    r_aut3_sup.font.superscript = True

    # Resumo
    p_res_tit = doc.add_paragraph()
    r_rt = p_res_tit.add_run("Resumo")
    r_rt.bold = True
    r_rt.font.size = Pt(12)

    p_res = doc.add_paragraph()
    p_res.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_res.paragraph_format.line_spacing = 1.0
    p_res.add_run(
        "A prática de esportes coletivos amadores no Brasil é frequentemente comprometida pela informalidade, pelo cancelamento de partidas por falta de quórum, "
        "pela presença de jogadores antidesportivos e pela insegurança física, que atinge gravemente as mulheres em virtude do assédio em espaços públicos. "
        "Este trabalho apresenta o desenvolvimento do Bora! App, uma social tech multiplataforma de conexão esportiva por geolocalização nativa (PostGIS). "
        "O levantamento de requisitos foi conduzido por meio de questionário estritamente anônimo com ramificação lógica no Microsoft Forms, "
        "em total conformidade com o princípio de minimização de dados da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). "
        "O sistema introduz quatro pilares de inovação: "
        "(1) Reputação Multidimensional 360° no estilo Uber (avaliando atletas, anfitrião, infraestrutura do local e o clima de fair play do jogo); "
        "(2) Blindagem Geoespacial e Espaço Seguro para Mulheres (RN06), que oculta partidas femininas no mapa para usuários masculinos; "
        "(3) Profissionalização de Amistosos com Súmula Eletrônica Consensual (placar, gols, substituições e MVP) e integração com Árbitros Avaliados e Federados (RN07/RN09); e "
        "(4) Compliance Esportivo e Canal de Denúncias contra Machismo, Racismo e LGBTfobia com protocolo de suspensão imediata e banimento definitivo (RN08). "
        "A arquitetura adota Clean Architecture em quatro camadas com Node.js/Fastify, TypeScript, PostgreSQL 16 + PostGIS, WebSockets e React com Material UI. "
        "Os testes e a validação demonstram tempo de resposta espacial inferior a 800ms no P95, rigorosa conformidade com a LGPD e elevado impacto social na promoção de um esporte amador seguro e inclusivo."
    )

    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.line_spacing = 1.0
    r_kw_lbl = p_kw.add_run("Palavras-chave: ")
    r_kw_lbl.bold = True
    p_kw.add_run("Amistosos Oficiais. Compliance Esportivo. Geolocalização. Lei Geral de Proteção de Dados (LGPD). Reputação Mútua. Segurança Feminina. Súmula Digital.")

    # Abstract
    p_abs_tit = doc.add_paragraph()
    r_atit = p_abs_tit.add_run("Abstract")
    r_atit.bold = True
    r_atit.font.size = Pt(12)

    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.line_spacing = 1.0
    r_abs_text = p_abs.add_run(
        "Amateur team sports practice in Brazil is frequently undermined by informality, lack of quorum, unsportsmanlike behavior, and physical insecurity, "
        "which critically affects women due to harassment in public spaces. This paper presents the development of Bora! App, a cross-platform sports social tech "
        "driven by native geolocation (PostGIS). Requirements elicitation was performed through a strictly anonymous branched survey on Microsoft Forms, "
        "in full compliance with the data minimization principle of the Brazilian General Data Protection Law (LGPD - Law 13,709/2018). "
        "The system establishes a high-trust ecosystem based on four core pillars: "
        "(1) 360° Multidimensional Reputation Uber-style (evaluating individual athlete behavior, match hosts, venue conditions, and match fair play atmosphere); "
        "(2) Geospatial Shielding and Safe Spaces for Women (RN06), hiding female matches on the map from male users; "
        "(3) Professionalization of Team Matches with Consensual Digital Match Reports (scores, goals, substitutions, and MVP) and integration with Community & Federated Referees (RN07/RN09); and "
        "(4) Sports Compliance and Anti-Bias Reporting Channel against sexism, racism, and LGBTphobia with immediate suspension and permanent ban protocols (RN08). "
        "The architecture implements Clean Architecture in four layers using Node.js/Fastify, TypeScript, PostgreSQL 16 with PostGIS, WebSockets, and React with Material UI. "
        "Validation proves sub-800ms geospatial response at P95, strict LGPD compliance, and high social impact in promoting safe amateur sports."
    )
    r_abs_text.italic = True

    p_akw = doc.add_paragraph()
    p_akw.paragraph_format.line_spacing = 1.0
    r_akw_lbl = p_akw.add_run("Keywords: ")
    r_akw_lbl.bold = True
    r_akw_val = p_akw.add_run("Digital Match Report. General Data Protection Law (LGPD). Geospatial Intelligence. Multidimensional Reputation. Referees. Sports Compliance. Women's Safety.")
    r_akw_val.italic = True

    doc.add_paragraph().paragraph_format.space_before = Pt(15)

    p_f1 = doc.add_paragraph()
    p_f1.paragraph_format.line_spacing = 1.0
    p_f1.add_run("1 Graduanda em Análise e Desenvolvimento de Sistemas pela Fatec Dr. Thomaz Novelino – Franca/SP.").font.size = Pt(9)
    p_f2 = doc.add_paragraph()
    p_f2.paragraph_format.line_spacing = 1.0
    p_f2.add_run("2 Graduando em Análise e Desenvolvimento de Sistemas pela Fatec Dr. Thomaz Novelino – Franca/SP.").font.size = Pt(9)
    p_f3 = doc.add_paragraph()
    p_f3.paragraph_format.line_spacing = 1.0
    p_f3.add_run("3 Docente e Orientador em Análise e Desenvolvimento de Sistemas pela Fatec Dr. Thomaz Novelino – Franca/SP.").font.size = Pt(9)

    doc.add_page_break()

    # ----------------------------------------------------
    # 1 INTRODUÇÃO
    # ----------------------------------------------------
    p_sec1 = doc.add_paragraph()
    r_s1 = p_sec1.add_run("1 Introdução")
    r_s1.bold = True
    r_s1.font.size = Pt(14)
    r_s1.font.color.rgb = primary_color

    p_intro1 = doc.add_paragraph()
    p_intro1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_intro1.add_run(
        "A prática regular de esportes coletivos e atividades físicas é reconhecida pela Organização Mundial da Saúde (OMS, 2020) como elemento fundamental "
        "para o combate às doenças crônicas, promoção da saúde mental e fortalecimento dos laços comunitários. Contudo, praticantes amadores enfrentam "
        "barreiras expressivas para manter uma rotina ativa: a dispersão de informações em redes sociais, a ausência de histórico de pontualidade e fair play entre desconhecidos, "
        "e o medo de assédio e violência física/verbal, que afasta de forma desproporcional as mulheres dos centros esportivos públicos."
    )

    p_intro2 = doc.add_paragraph()
    p_intro2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_intro2.add_run(
        "Nesse contexto, surge a questão problema deste trabalho: de que maneira uma plataforma baseada em geolocalização nativa, reputação multidimensional 360°, "
        "blindagem geoespacial feminina e compliance ético com canal de denúncias pode estruturar o esporte amador e garantir ambientes seguros e inclusivos? "
        "A hipótese central postula que a aplicação de inteligência espacial no banco de dados (PostGIS), aliada à verificação de identidade com trava de CPF, "
        "avaliação contínua de conduta de atletas, locais, anfitriões e arbitragem qualificada, e banimento sumário de atitudes discriminatórias (RN08), "
        "estabelece um ecossistema sustentável e seguro para a prática esportiva."
    )

    # 1.1 TAP
    p_tap_tit = doc.add_paragraph()
    p_tap_tit.add_run("1.1 Termo de Abertura do Projeto (TAP)").bold = True

    p_tap_desc = doc.add_paragraph()
    p_tap_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_tap_desc.add_run(
        "O Termo de Abertura do Projeto (TAP), formalizado no Quadro 1, autoriza o desenvolvimento do Bora! App conforme diretrizes do Guia PMBOK (PMI, 2021) e Kerzner (2017)."
    )

    p_q_tap_lbl = doc.add_paragraph()
    p_q_tap_lbl.add_run("Quadro 1 – Síntese do Termo de Abertura do Projeto (TAP)").bold = True

    t_tap = doc.add_table(rows=8, cols=2)
    t_tap.alignment = WD_TABLE_ALIGNMENT.CENTER
    tap_items = [
        ("Título do Projeto", "Bora! App — Social Tech de Conexão Esportiva, Reputação Mútua, Gestão de Amistosos, Segurança Feminina & Compliance Ético."),
        ("Justificativa", "Superar o sedentarismo e a insegurança na organização de jogos amadores através de tecnologia geoespacial, reputação 360° e proteção feminina."),
        ("Objetivo Smart", "Entregar um MVP funcional integrado ao PostGIS com 3 CRUDs, autenticação com trava de CPF, súmula digital, canal de denúncias e módulo de arbitragem no 2º semestre de 2026."),
        ("Equipe Discente", "Renata Saraiva Claudino (Líder de Projeto/UI/UX/Requisitos) e Leonardo Lopes dos Santos (Arquitetura/Backend/Dados)."),
        ("Orientação", "Prof. Me. Carlos Eduardo de França Roland (FATEC Franca)."),
        ("Premissas", "Adoção de Clean Architecture em 4 camadas, banco PostgreSQL 16 com extensão PostGIS e estrita conformidade com a LGPD (Privacy by Design)."),
        ("Restrições", "Desenvolvimento restrito a ferramentas gratuitas/open-source e prazo vinculado ao calendário letivo da FATEC de 2026."),
        ("Marcos Principais", "M1: TAP e Elicitação Anônima (LGPD); M2: Modelagem e DDL; M3: Prototipagem Hi-Fi; M4: 3 CRUDs, Súmulas e Testes; M5: Homologação e Defesa de TG.")
    ]
    for i, (campo, val) in enumerate(tap_items):
        row = t_tap.rows[i]
        c1, c2 = row.cells
        c1.width = Inches(2.2)
        c2.width = Inches(4.5)
        c1.paragraphs[0].add_run(campo).bold = True
        c1.paragraphs[0].paragraph_format.line_spacing = 1.0
        c2.paragraphs[0].add_run(val)
        c2.paragraphs[0].paragraph_format.line_spacing = 1.0
        set_cell_shading(c1, "F1F5F9")
        set_cell_margins(c1)
        set_cell_margins(c2)

    doc.add_page_break()

    # ----------------------------------------------------
    # 2 VIABILIDADE DO PROJETO
    # ----------------------------------------------------
    p_sec2 = doc.add_paragraph()
    r_s2 = p_sec2.add_run("2 Viabilidade do Projeto")
    r_s2.bold = True
    r_s2.font.size = Pt(14)
    r_s2.font.color.rgb = primary_color

    p_bmc_tit = doc.add_paragraph()
    p_bmc_tit.add_run("2.1 Canvas de Negócio (Business Model Canvas - BMC)").bold = True

    p_q_bmc_lbl = doc.add_paragraph()
    p_q_bmc_lbl.add_run("Quadro 2 – Business Model Canvas (BMC) do Bora! App").bold = True

    t_bmc = doc.add_table(rows=9, cols=2)
    t_bmc.alignment = WD_TABLE_ALIGNMENT.CENTER
    bmc_items = [
        ("1. Segmentos de Clientes", "Atletas amadores (homens e mulheres), times amadores, gestores de quadras privadas e árbitros esportivos."),
        ("2. Propostas de Valor", "Conexão esportiva ágil por PostGIS, reputação mútua 360°, espaço seguro para mulheres (mapa blindado), súmula digital e canal de denúncias contra preconceitos."),
        ("3. Canais de Distribuição", "Aplicativo mobile multiplataforma (PWA / React Native) e plataforma web responsiva."),
        ("4. Relacionamento com Clientes", "Autosserviço com moderação comunitária automatizada por nota média (< 2.0 gera suspensão) e ouvidoria ágil com banimento definitivo para discriminação."),
        ("5. Fontes de Receita", "Gratuidade em locais públicos; taxa de conveniência em reservas de quadras particulares parceiras e curadoria de arbitragem qualificada."),
        ("6. Recursos-Chave", "Motor geoespacial PostGIS, banco de dados PostgreSQL, algoritmos de reputação, WebSockets e esteira de CI/CD em nuvem."),
        ("7. Atividades-Chave", "Desenvolvimento de software, curadoria de árbitros, moderação de denúncias e manutenção da segurança."),
        ("8. Parcerias-Chave", "Centros Esportivos Públicos (CEPELs Franca), FEAC Franca, ligas e associações de árbitros e arenas esportivas privadas."),
        ("9. Estrutura de Custos", "Servidores cloud (VPS / Docker), manutenção de banco de dados, domínio, segurança da informação e horas técnicas de engenharia.")
    ]
    for i, (bloco, det) in enumerate(bmc_items):
        r = t_bmc.rows[i]
        c1, c2 = r.cells
        c1.width = Inches(2.2)
        c2.width = Inches(4.5)
        c1.paragraphs[0].add_run(bloco).bold = True
        c1.paragraphs[0].paragraph_format.line_spacing = 1.0
        c2.paragraphs[0].add_run(det)
        c2.paragraphs[0].paragraph_format.line_spacing = 1.0
        set_cell_shading(c1, "EFF6FF")
        set_cell_margins(c1)
        set_cell_margins(c2)

    # 2.2 SWOT
    p_swot_tit = doc.add_paragraph()
    p_swot_tit.add_run("\n2.2 Matriz SWOT").bold = True

    p_q_swot_lbl = doc.add_paragraph()
    p_q_swot_lbl.add_run("Quadro 3 – Matriz SWOT do Bora! App").bold = True

    t_swot = doc.add_table(rows=2, cols=2)
    t_swot.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_f, c_w = t_swot.rows[0].cells
    c_f.width = Inches(3.35)
    c_w.width = Inches(3.35)
    c_f.paragraphs[0].add_run("FORÇAS (Strengths)\n").bold = True
    c_f.paragraphs[0].add_run(
        "• Motor geoespacial PostGIS (GiST < 800ms).\n"
        "• Reputação 360° (atletas, anfitrião, local, clima e juiz).\n"
        "• Espaço Seguro Feminino (RN06) com blindagem no mapa.\n"
        "• Compliance Ético com canal de denúncias e banimento (RN08).\n"
        "• Súmula Digital Consensual e Arbitragem Qualificada (RN07/RN09)."
    )
    c_w.paragraphs[0].add_run("FRAQUEZAS (Weaknesses)\n").bold = True
    c_w.paragraphs[0].add_run(
        "• Dependência de efeito de rede inicial na região.\n"
        "• Custo potencial de consumo de APIs de mapas em escala.\n"
        "• Processo de curadoria inicial de árbitros cadastrados.\n"
        "• Equipe acadêmica enxuta de dois desenvolvedores."
    )
    set_cell_shading(c_f, "EFF6FF")
    set_cell_shading(c_w, "FFFBEB")
    set_cell_margins(c_f)
    set_cell_margins(c_w)

    c_o, c_t = t_swot.rows[1].cells
    c_o.width = Inches(3.35)
    c_t.width = Inches(3.35)
    c_o.paragraphs[0].add_run("OPORTUNIDADES (Opportunities)\n").bold = True
    c_o.paragraphs[0].add_run(
        "• Políticas de incentivo ao esporte feminino e apoio da FEAC.\n"
        "• Parceria com ligas de árbitros e +12 CEPELs de Franca/SP.\n"
        "• Convênios B2B com quadras particulares de society.\n"
        "• Forte impacto social no combate ao assédio e preconceitos."
    )
    c_t.paragraphs[0].add_run("AMEAÇAS (Threats)\n").bold = True
    c_t.paragraphs[0].add_run(
        "• Hábito consolidado de grupos informais de WhatsApp.\n"
        "• Concorrentes globais de nicho (Strava, Playtomic).\n"
        "• Riscos de conformidade LGPD no tratamento de denúncias."
    )
    set_cell_shading(c_o, "F0FDF4")
    set_cell_shading(c_t, "FEF2F2")
    set_cell_margins(c_o)
    set_cell_margins(c_t)

    # 2.3 5W2H
    p_5w_tit = doc.add_paragraph()
    p_5w_tit.add_run("\n2.3 Plano de Ação 5W2H").bold = True

    p_q_5w_lbl = doc.add_paragraph()
    p_q_5w_lbl.add_run("Quadro 4 – Plano de Ação 5W2H").bold = True

    t_5w = doc.add_table(rows=7, cols=2)
    t_5w.alignment = WD_TABLE_ALIGNMENT.CENTER
    w_items = [
        ("What (O quê?)", "Plataforma de geolocalização esportiva com reputação multidimensional, espaço seguro para mulheres, súmulas oficiais e canal de denúncias."),
        ("Why (Por quê?)", "Eliminar a falta de quórum, desestimular a violência em campo e erradicar o assédio, o machismo e o racismo no esporte amador."),
        ("Who (Quem?)", "Renata Saraiva Claudino e Leonardo Lopes dos Santos (Alunos do 5º Semestre de ADS - FATEC Franca), orientados pelo Prof. Carlos Roland."),
        ("Where (Onde?)", "Franca/SP (CEPELs públicos e quadras particulares), estruturado em arquitetura em nuvem expansível nacionalmente."),
        ("When (Quando?)", "Desenvolvimento, testes automatizados e defesa de TG no ano letivo de 2026."),
        ("How (Como?)", "Clean Architecture em 4 camadas, Fastify/Node.js, TypeScript, PostgreSQL 16 + PostGIS, WebSockets e React com Material UI."),
        ("How Much (Quanto?)", "Estimativa de 250 horas técnicas (R$ 20.000,00) e custo fixo de infraestrutura em nuvem de ~R$ 450,00/mês.")
    ]
    for i, (dim, desc) in enumerate(w_items):
        row = t_5w.rows[i]
        c1, c2 = row.cells
        c1.width = Inches(2.2)
        c2.width = Inches(4.5)
        c1.paragraphs[0].add_run(dim).bold = True
        c1.paragraphs[0].paragraph_format.line_spacing = 1.0
        c2.paragraphs[0].add_run(desc)
        c2.paragraphs[0].paragraph_format.line_spacing = 1.0
        set_cell_shading(c1, "F1F5F9")
        set_cell_margins(c1)
        set_cell_margins(c2)

    doc.add_page_break()

    # ----------------------------------------------------
    # 3 LEVANTAMENTO DE REQUISITOS
    # ----------------------------------------------------
    p_sec3 = doc.add_paragraph()
    r_s3 = p_sec3.add_run("3 Levantamento de Requisitos e Modelagem")
    r_s3.bold = True
    r_s3.font.size = Pt(14)
    r_s3.font.color.rgb = primary_color

    # 3.1 Elicitação e LGPD
    p_elic_tit = doc.add_paragraph()
    p_elic_tit.add_run("3.1 Elicitação de Requisitos e Conformidade com a LGPD (Pesquisa Anônima)").bold = True

    p_elic_desc1 = doc.add_paragraph()
    p_elic_desc1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_elic_desc1.add_run(
        "A elicitação de requisitos do Bora! App foi executada por meio de um questionário estruturado com ramificação lógica (branching) "
        "aplicado digitalmente a praticantes de esportes amadores. Em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais "
        "(LGPD — Lei nº 13.709/2018, Art. 6º, inciso III — Princípio da Minimização de Dados), a pesquisa foi conduzida de forma "
        "<b>estritamente anônima</b>, prescindindo de coleta de nomes, telefones, e-mails ou quaisquer dados identificadores diretos."
    )

    p_elic_desc2 = doc.add_paragraph()
    p_elic_desc2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_elic_desc2.add_run(
        "A garantia de anonimato absoluto fundamenta-se em duas justificativas metodológicas essenciais: "
        "(1) Eliminação do viés de inibição social (social desirability bias), assegurando respostas autênticas em questões altamente sensíveis, "
        "tais como o histórico de assédio/importunação sexual vivenciado por mulheres em espaços públicos e a adesão ao banimento definitivo "
        "para atos de racismo, machismo, homofobia e agressão física; e "
        "(2) Otimização da taxa de conversão da pesquisa, reduzindo o atrito e a desistência dos respondentes ao focar exclusivamente "
        "nas variáveis quantitativas e comportamentais necessárias para a Engenharia de Software. O roteiro de 12 perguntas encontra-se no Apêndice 2."
    )

    # 3.2 Resultados Quantitativos da Pesquisa
    p_res_tit = doc.add_paragraph()
    p_res_tit.add_run("\n3.2 Resultados e Análise Quantitativa da Pesquisa de Campo (N = 31)").bold = True

    p_res_intro = doc.add_paragraph()
    p_res_intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_res_intro.add_run(
        "A pesquisa de campo obteve uma amostra qualificada de 31 praticantes e entusiastas de esportes coletivos e individuais. "
        "Os dados tabulados no Quadro 4.1 revelam as principais dores, preferências e necessidades operacionais do público-alvo, "
        "fornecendo sustentação empírica direta para a definição do escopo, requisitos funcionais e regras de negócio do Bora! App."
    )

    p_q_res_lbl = doc.add_paragraph()
    p_q_res_lbl.add_run("Quadro 4.1 – Resultados Consolidados da Pesquisa de Elicitação de Requisitos").bold = True

    pesquisa_data = [
        ("Q1. Faixa Etária", "26 a 35 anos (64,5%); 18 a 25 anos (16,1%); 36 a 45 anos (12,9%); Mais de 45 anos (6,5%).", "Predomínio de jovens adultos economicamente ativos, orientando a interface para fluidez mobile e agilidade no aceite."),
        ("Q2. Modalidades Mais Praticadas / Desejadas", "Futebol / Society (41,9%); Vôlei / Futevôlei (41,9%); Futsal (25,8%); Beach Tennis (19,4%); Basquete (19,4%); Outros (45,2%).", "Necessidade de arquitetura multiesportiva flexível e filtros de modalidade dinâmicos no mapa."),
        ("Q3. Principal Obstáculo para Prática Regular", "Falta de tempo (35,5%); Dificuldade de locais/horários (25,8%); Falta de companhia/time incompleto (25,8%); Insegurança (12,9%).", "Justifica a criação do mural de vagas avulsas e mapa em tempo real para fechamento rápido de quórum."),
        ("Q4. Raio Máximo de Deslocamento", "Até 5 km (51,6%); Mais de 10 km (22,6%); Até 2 km / Bairro (19,4%); Até 10 km (6,5%).", "Mais de 71% buscam partidas em até 5 km, embasando o raio padrão de busca geoespacial via PostGIS."),
        ("Q5. Identificação de Gênero", "Masculino (61,3%); Feminino (35,5%); Outro / Não informado (3,2%).", "Amostragem expressiva feminina (11 respondentes) permitindo validação estatística consistente do recorte de gênero."),
        ("Q6. Assédio/Insegurança em Quadras Públicas [Mulheres]", "Sim, com frequência (54,5%); Sim, às vezes (36,4%); Não, nunca passei por isso (9,1%). Total Sim: 90,9%.", "Dado alarmante de 90,9% de vulnerabilidade feminina, comprovando a urgência de soluções de segurança e espaços protegidos."),
        ("Q7. Blindagem de Mapa Oculto para Homens (RN06) [Mulheres]", "Indispensável / Muito importante (81,8%); Pouco importante (9,1%); Indiferente (9,1%).", "Aprovação maciça da RN06, legitimando a regra arquitetural de ocultação física da localização de jogos femininos para homens."),
        ("Q8. Sistema de Reputação Mútua 360° (Estilo Uber)", "Essencial para evitar descompromissados/violentos (58,1%); Útil (41,9%). Total Favorável: 100%.", "Consenso absoluto (100%) em torno da avaliação pós-jogo (1 a 5 estrelas) como filtro de convivência saudável."),
        ("Q9. Avaliação do Local, Anfitrião e Clima do Jogo", "Sim, ajuda a escolher jogos saudáveis e boas quadras (87,1%); Apenas atletas individuais (9,7%); Indiferente (3,2%).", "Fundamenta a métrica multidimensional de Clima de Fair Play e auditoria da conservação das quadras."),
        ("Q10. Súmula Digital Oficial em Amistosos", "Sim, traz seriedade, organização e histórico para o time (90,3%); Não vejo necessidade (9,7%).", "Apoio de 90,3% à formalização de confrontos entre equipes com validação consensual pelos capitães."),
        ("Q11. Perfil de Arbitragem em Jogos Pagos", "Modelo Híbrido - Comunitário e Federado (41,9%); Árbitros com boa nota comunitária (19,4%); Apenas Federados (6,5%).", "Orienta a plataforma a manter curadoria dupla: árbitros experientes avaliados e árbitros federados oficiais."),
        ("Q12. Tolerância Zero com Banimento Definitivo (RN08)", "Apoio totalmente - Tolerância Zero (90,3%); Apenas advertência verbal (9,7%).", "Base empírica para o canal ágil de denúncias contra machismo, racismo, homofobia e agressões, com banimento imediato.")
    ]

    t_pesq = doc.add_table(rows=len(pesquisa_data)*2, cols=3)
    t_pesq.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (p_item, p_respostas, p_impacto) in enumerate(pesquisa_data):
        r_top = t_pesq.rows[idx*2]
        r_bot = t_pesq.rows[idx*2 + 1]
        
        c_p, c_r, c_vazio = r_top.cells
        c_p.width = Inches(2.7)
        c_r.width = Inches(4.0)
        c_p.paragraphs[0].add_run(p_item).bold = True
        c_p.paragraphs[0].paragraph_format.line_spacing = 1.0
        c_r.paragraphs[0].add_run(f"Respostas: {p_respostas}")
        c_r.paragraphs[0].paragraph_format.line_spacing = 1.0
        set_cell_shading(c_p, "F1F5F9")
        set_cell_shading(c_r, "F1F5F9")
        set_cell_shading(c_vazio, "F1F5F9")
        
        c_imp = r_bot.cells[0]
        r_bot.cells[0].merge(r_bot.cells[1]).merge(r_bot.cells[2])
        r_bot_lbl = c_imp.paragraphs[0].add_run("Impacto na Engenharia de Software: ")
        r_bot_lbl.bold = True
        c_imp.paragraphs[0].add_run(p_impacto)
        c_imp.paragraphs[0].paragraph_format.line_spacing = 1.0
        set_cell_margins(c_p)
        set_cell_margins(c_r)
        set_cell_margins(c_imp)

    # 3.3 Requisitos Funcionais (Quadro 5)
    p_rf_tit = doc.add_paragraph()
    p_rf_tit.add_run("\n3.3 Requisitos Funcionais").bold = True

    p_q_rf_lbl = doc.add_paragraph()
    p_q_rf_lbl.add_run("Quadro 5 – Requisitos Funcionais do Sistema").bold = True

    rfs_data = [
        ("RF001 - Cadastro com Trava Dupla", "Evidente", "Altíssima", "O sistema deve cadastrar usuários exigindo unicidade de E-mail e CPF com validação matemática Módulo 11 e senha Bcrypt."),
        ("RF002 - Verificação por Código OTP", "Evidente", "Altíssima", "O sistema deve validar o e-mail via código OTP de 6 dígitos gerado com expiração temporal de 10 minutos."),
        ("RF003 - Autenticação Social", "Evidente", "Alta", "O sistema deve permitir login com contas externas Google Identity e Apple ID."),
        ("RF004 - Mapa Interativo PostGIS", "Evidente", "Altíssima", "O sistema deve plotar partidas disponíveis no mapa em raio de 1 a 30 km utilizando consultas espaciais ST_DWithin."),
        ("RF005 - Filtro e Blindagem Feminina", "Evidente", "Altíssima", "O sistema deve permitir filtrar partidas exclusivas para mulheres e ocultar esses eventos para usuários homens (RN06)."),
        ("RF006 - Gestão de Partidas e Amistosos", "Evidente", "Altíssima", "O sistema deve suportar criação de partidas avulsas e desafios de amistosos entre equipes formadas."),
        ("RF007 - Precificação e Taxas (RN04)", "Oculto", "Altíssima", "O sistema deve garantir gratuidade de taxa de campo em locais públicos e divisão 50/50 de taxa de arbitragem em amistosos."),
        ("RF008 - Ciclo de Vida da Partida", "Oculto", "Alta", "O sistema deve gerenciar os estados: Rascunho, Publicada, Lotada, Em_Andamento, Finalizada e Cancelada."),
        ("RF009 - Painel de Decisão do Anfitrião", "Evidente", "Altíssima", "O organizador deve visualizar histórico e nota média de 1 a 5 estrelas do solicitante antes de aceitar ou recusar a vaga."),
        ("RF010 - Chat em Tempo Real", "Evidente", "Alta", "O sistema deve fornecer sala de chat via WebSocket restrita aos atletas aprovados e ao organizador."),
        ("RF011 - Avaliação Multidimensional 360°", "Evidente", "Altíssima", "Permitir avaliação mútua entre atletas, do anfitrião, do local/quadra, do clima esportivo (fair play vs estresse) e da arbitragem."),
        ("RF012 - Auditoria e Soft Delete", "Oculto", "Alta", "O sistema deve registrar logs imutáveis de alterações com deltas JSONB e exclusão lógica em todas as tabelas (LGPD)."),
        ("RF013 - Súmula Digital da Partida", "Evidente", "Altíssima", "O sistema deve permitir registro consensual pós-jogo de placar, gols/pontos marcados, cartões, substituições e MVP (RN09)."),
        ("RF014 - Módulo de Arbitragem Qualificada", "Evidente", "Altíssima", "O sistema deve gerenciar árbitros comunitários avaliados e validar árbitros federados com selo de verificação oficial (RN07)."),
        ("RF015 - Canal de Denúncias e Compliance", "Evidente", "Altíssima", "Fornecer botão de denúncia com categorias (Machismo, Racismo, Homofobia, Violência) com suspensão imediata e banimento (RN08).")
    ]

    t_rf = doc.add_table(rows=len(rfs_data)*2, cols=3)
    t_rf.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (cod, cat, pri, desc) in enumerate(rfs_data):
        r_top = t_rf.rows[idx*2]
        r_bot = t_rf.rows[idx*2 + 1]
        
        c_cod, c_cat, c_pri = r_top.cells
        c_cod.width = Inches(2.7)
        c_cat.width = Inches(2.0)
        c_pri.width = Inches(2.0)
        c_cod.paragraphs[0].add_run(cod).bold = True
        c_cat.paragraphs[0].add_run(f"Categoria: {cat}")
        c_pri.paragraphs[0].add_run(f"Prioridade: {pri}")
        set_cell_shading(c_cod, "F1F5F9")
        set_cell_shading(c_cat, "F1F5F9")
        set_cell_shading(c_pri, "F1F5F9")
        
        c_desc = r_bot.cells[0]
        r_bot.cells[0].merge(r_bot.cells[1]).merge(r_bot.cells[2])
        c_desc.paragraphs[0].add_run(f"Descrição: {desc}")
        c_desc.paragraphs[0].paragraph_format.line_spacing = 1.0
        set_cell_margins(c_cod)
        set_cell_margins(c_cat)
        set_cell_margins(c_pri)
        set_cell_margins(c_desc)

    doc.add_page_break()

    # 3.4 e 3.5 RNF e RN (Quadros 6 e 7)
    p_rnf_tit = doc.add_paragraph()
    p_rnf_tit.add_run("3.4 Requisitos Não Funcionais").bold = True

    p_q_rnf_lbl = doc.add_paragraph()
    p_q_rnf_lbl.add_run("Quadro 6 – Requisitos Não Funcionais do Sistema").bold = True

    rnfs_data = [
        ("RNF001 - Multiplataforma", "Interface responsiva em React + Material UI otimizada para mobile e web.", "Obrigatório", "Permanente"),
        ("RNF002 - Segurança Feminina & LGPD", "Coordenadas exatas permanecem ocultas até o aceite e partidas femininas são blindadas contra visualização masculina (Safety by Design).", "Obrigatório", "Permanente"),
        ("RNF003 - Performance PostGIS", "Consultas espaciais ST_DWithin sobre índices GiST com tempo de resposta inferior a 800 ms no percentil 95 (P95).", "Obrigatório", "Permanente"),
        ("RNF004 - Criptografia de Dados", "Senhas armazenadas com Bcrypt (10 salt rounds) e autenticação stateless via tokens JWT assinados.", "Obrigatório", "Permanente"),
        ("RNF005 - Baixa Latência de Chat", "O tráfego de mensagens em tempo real via WebSocket deve operar com latência de entrega inferior a 200 ms.", "Desejável", "Permanente")
    ]

    t_rnf = doc.add_table(rows=len(rnfs_data)+1, cols=4)
    t_rnf.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_rnf.rows[0]
    for idx, h_text in enumerate(["Código / Nome", "Descrição do Requisito", "Tipo", "Duração"]):
        hdr.cells[idx].paragraphs[0].add_run(h_text).bold = True
        set_cell_shading(hdr.cells[idx], "E2E8F0")
        set_cell_margins(hdr.cells[idx])

    for i, (cod, dsc, tp, dur) in enumerate(rnfs_data):
        row = t_rnf.rows[i+1]
        c1, c2, c3, c4 = row.cells
        c1.width = Inches(1.8)
        c2.width = Inches(3.2)
        c3.width = Inches(1.0)
        c4.width = Inches(1.0)
        c1.paragraphs[0].add_run(cod).bold = True
        c2.paragraphs[0].add_run(dsc)
        c3.paragraphs[0].add_run(tp)
        c4.paragraphs[0].add_run(dur)
        for c in [c1, c2, c3, c4]:
            c.paragraphs[0].paragraph_format.line_spacing = 1.0
            set_cell_margins(c)

    p_rn_tit = doc.add_paragraph()
    p_rn_tit.add_run("\n3.5 Regras de Negócio").bold = True
    p_rn_tit.paragraph_format.space_before = Pt(10)

    p_q_rn_lbl = doc.add_paragraph()
    p_q_rn_lbl.add_run("Quadro 7 – Regras de Negócio do Sistema").bold = True

    rns_data = [
        ("RN001 - Anti-conflito de Agenda", "Um atleta é estritamente impedido de solicitar vaga ou ser aprovado em partidas com sobreposição de horário dentro de uma janela padrão de ±2 horas."),
        ("RN002 - Privacidade Espacial LGPD", "O endereço exato e rota GPS permanecem ofuscados na listagem pública do mapa, sendo revelados apenas após a aprovação formal do anfitrião."),
        ("RN003 - Trava de Cancelamento em Partidas Lotadas", "O anfitrião não pode cancelar diretamente partidas com status 'Lotada', exigindo intermediação do suporte."),
        ("RN004 - Precificação de Espaços e Arbitragem", "Espaços públicos têm taxa de campo = R$ 0,00; taxa de arbitragem aplica-se a Amistosos de Equipes com divisão automática 50/50."),
        ("RN005 - Moderação Automática por Reputação", "Atletas com 5 ou mais avaliações acumuladas cuja nota média for inferior a 2.00 estrelas são suspensos automaticamente pelo sistema."),
        ("RN006 - Espaço Seguro Feminino", "Partidas criadas como 'Exclusivo Feminino' são invisíveis no mapa e nas buscas para usuários masculinos, sendo proibida a solicitação por homens."),
        ("RN007 - Qualificação e Homologação de Arbitragem", "A plataforma gerencia árbitros comunitários avaliados (1 a 5 estrelas) e concede selo de homologação a árbitros federados com registro comprovado."),
        ("RN008 - Tolerância Zero a Discriminação e Violência", "Denúncias confirmadas de machismo, racismo, homofobia ou agressão acarretam banimento imediato e definitivo da plataforma."),
        ("RN009 - Súmula Eletrônica Consensual", "O resumo estatístico (placar, gols, faltas) preenchido pelo juiz ou anfitrião só é homologado após a confirmação digital do capitão adversário.")
    ]

    t_rn = doc.add_table(rows=len(rns_data), cols=2)
    t_rn.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (cod, desc) in enumerate(rns_data):
        row = t_rn.rows[i]
        c1, c2 = row.cells
        c1.width = Inches(2.3)
        c2.width = Inches(4.4)
        c1.paragraphs[0].add_run(cod).bold = True
        c1.paragraphs[0].paragraph_format.line_spacing = 1.0
        c2.paragraphs[0].add_run(desc)
        c2.paragraphs[0].paragraph_format.line_spacing = 1.0
        set_cell_shading(c1, "F8FAFC")
        set_cell_margins(c1)
        set_cell_margins(c2)

    doc.add_page_break()

    # 3.6 Casos de Uso (Quadros 8 a 17)
    p_uc_tit = doc.add_paragraph()
    p_uc_tit.add_run("3.6 Casos de Uso").bold = True

    ucs_specs = [
        ("Quadro 8 – Caso de Uso UC001", "UC001", "Gerenciar Perfil e Autenticação com Trava Dupla", "Jogador / Organizador", "Nenhuma (cadastro) ou Usuário logado (edição).",
         "1. O usuário informa Nome, E-mail, CPF, Gênero, Data de Nascimento e Senha.\n2. O sistema valida o CPF pelo Módulo 11 e verifica duplicidade no banco.\n3. O sistema gera código OTP de 6 dígitos e envia por e-mail.\n4. O usuário valida o código e ativa perfil com foto, modalidades e time.",
         "CPF inválido ou e-mail duplicado bloqueia a operação imediatamente.", "Perfil ativo e credenciais salvas no banco com hash Bcrypt."),
        
        ("Quadro 9 – Caso de Uso UC002", "UC002", "Consultar Mapa de Partidas e Amistosos", "Jogador / Organizador", "Usuário autenticado com permissão de GPS.",
         "1. O usuário acessa a aba Mapa ou Feed.\n2. O sistema executa ST_DWithin no PostGIS no raio parametrizado.\n3. O sistema aplica a RN06 (oculta partidas femininas para homens).\n4. O sistema plota os alfinetes e exibe horário, vagas e nota média do anfitrião.",
         "Sem sinal de GPS: exibe busca manual por bairro.", "Partidas disponíveis exibidas com proteção de endereço (RN02)."),
        
        ("Quadro 10 – Caso de Uso UC003", "UC003", "Cadastrar Partida ou Desafio de Amistoso", "Organizador / Capitão", "Usuário autenticado com status Ativo.",
         "1. O organizador clica em 'Criar Partida'.\n2. Define esporte, formato (Avulso vs Amistoso), gênero (Misto vs Exclusivo Feminino), vagas e local.\n3. Aplica regra RN04 de precificação e escala árbitro comunitário ou federado (RN07).\n4. O sistema valida dados e persiste a partida como 'Publicada'.",
         "Tentativa de cobrar taxa de campo em local público gera erro RN04.", "Partida indexada geograficamente no PostGIS e visível no mapa."),
        
        ("Quadro 11 – Caso de Uso UC004", "UC004", "Solicitar Participação em Partida", "Jogador solicitante", "Usuário ativo e partida com vagas abertas.",
         "1. O jogador clica em 'Solicitar Vaga'.\n2. O sistema valida RN01 (anti-conflito de 2 horas) e RN06 (restrição de gênero).\n3. O sistema grava a solicitação como 'Pendente' e notifica o organizador.",
         "Homem solicitando vaga em partida feminina ou conflito de agenda gera bloqueio.", "Solicitação aguardando deliberação do dono da partida."),
        
        ("Quadro 12 – Caso de Uso UC005", "UC005", "Avaliar Reputação Multidimensional (Uber 360°)", "Participantes da partida", "Partida no estado 'Finalizada'.",
         "1. Ao término do jogo, o sistema abre formulário multidimensional.\n2. Atletas avaliam mutuamente a conduta dos colegas; avaliam o anfitrião, o local/quadra, o clima esportivo (fair play) e a atuação do juiz.\n3. O sistema grava as notas e recalcula médias.\n4. Se a nota de um atleta for < 2.0 (com 5+ avaliações), aplica suspensão automática (RN05).",
         "Nota fora do intervalo 1 a 5 é rejeitada pela validação Zod.", "Reputações atualizadas no ecossistema."),
        
        ("Quadro 13 – Caso de Uso UC006", "UC006", "Gerenciar Solicitações de Vagas (Painel do Dono)", "Organizador da Partida", "Partida publicada com solicitações pendentes.",
         "1. O organizador abre o painel de solicitações.\n2. Visualiza foto, modalidades e nota média de conduta do atleta solicitante.\n3. Clica em 'Aceitar' ou 'Recusar'.\n4. Ao aceitar: a vaga é preenchida, o atleta recebe rota GPS (RN02) e entra no Chat.",
         "Vagas esgotadas encerram automaticamente as demais solicitações.", "Vagas atualizadas e notificação push enviada ao atleta."),
        
        ("Quadro 14 – Caso de Uso UC007", "UC007", "Interagir no Chat da Partida em Tempo Real", "Organizador e Atletas Aprovados", "Usuário confirmado na partida.",
         "1. O participante acessa a sala de chat da partida via WebSocket dedicado.\n2. Troca mensagens instantâneas de alinhamento tático, uniformes e caronas.",
         "Usuário não aprovado é barrado pelo middleware de autenticação.", "Mensagens gravadas no banco e entregues em tempo real (< 200ms)."),

        ("Quadro 15 – Caso de Uso UC008", "UC008", "Gerenciar Súmula Digital e Resumo da Partida", "Organizador / Juiz e Capitão Adversário", "Partida concluída.",
         "1. O juiz ou anfitrião preenche a súmula: placar final, autores dos gols/pontos, substituições e MVP.\n2. O capitão adversário recebe notificação para conferência e validação.\n3. Ao confirmar (RN09), a súmula é homologada e alimenta o histórico dos times.",
         "Divergência de dados abre mediação no suporte.", "Estatísticas gravadas na tabela sumula_partida."),

        ("Quadro 16 – Caso de Uso UC009", "UC009", "Registrar Denúncia Ética e Compliance", "Qualquer participante", "Ocorrência de infração grave na partida.",
         "1. O usuário clica no botão 'Denunciar' no perfil do infrator ou na súmula.\n2. Seleciona a categoria: Machismo/Assédio, Racismo, Homofobia ou Agressão Física.\n3. Descreve o ocorrido e anexa evidências.\n4. O sistema gera chamado prioritário no auditoria_log e aplica suspensão preventiva imediata (RN08).",
         "Denúncia sem descrição obrigatória é bloqueada.", "Processo disciplinar instaurado para banimento permanente."),

        ("Quadro 17 – Caso de Uso UC010", "UC010", "Homologar Cadastro e Perfil de Arbitragem", "Árbitro Esportivo e Moderação", "Usuário árbitro.",
         "1. O árbitro informa experiência comunitária ou envia comprovante de registro federativo.\n2. A moderação valida documentos e atribui o selo de 'Juiz Federado' ou habilita 'Árbitro Comunitário'.\n3. O perfil fica disponível para escalas em amistosos oficiais (RN07).",
         "Documento inválido gera indeferimento do selo federado.", "Árbitro habilitado na plataforma.")
    ]

    for q_lbl, ucid, nome, ator, pre, fluxo, exc, pos in ucs_specs:
        p_qlbl = doc.add_paragraph()
        p_qlbl.add_run(f"{q_lbl} – {nome}").bold = True
        
        t_uc = doc.add_table(rows=6, cols=2)
        t_uc.alignment = WD_TABLE_ALIGNMENT.CENTER
        uc_rows = [
            ("ID / Nome", f"{ucid} — {nome}"),
            ("Ator Primário", ator),
            ("Pré-condição", pre),
            ("Cenário Principal", fluxo),
            ("Cenário de Exceção", exc),
            ("Pós-condição", pos)
        ]
        for idx_r, (k, v) in enumerate(uc_rows):
            r = t_uc.rows[idx_r]
            c1, c2 = r.cells
            c1.width = Inches(1.8)
            c2.width = Inches(4.9)
            c1.paragraphs[0].add_run(k).bold = True
            c1.paragraphs[0].paragraph_format.line_spacing = 1.0
            c2.paragraphs[0].add_run(v)
            c2.paragraphs[0].paragraph_format.line_spacing = 1.0
            set_cell_shading(c1, "F1F5F9")
            set_cell_margins(c1)
            set_cell_margins(c2)
        doc.add_paragraph().paragraph_format.space_before = Pt(4)

    doc.add_page_break()

    # 3.11 Matrizes de Rastreabilidade (Quadros 18 e 19)
    p_rast_tit = doc.add_paragraph()
    r_rast = p_rast_tit.add_run("3.11 Matrizes de Rastreabilidade")
    r_rast.bold = True
    r_rast.font.size = Pt(13)

    p_q_ma_lbl = doc.add_paragraph()
    p_q_ma_lbl.add_run("Quadro 18 – Matriz A: Requisitos Funcionais × Regras de Negócio").bold = True

    t_ma = doc.add_table(rows=11, cols=10)
    t_ma.alignment = WD_TABLE_ALIGNMENT.CENTER
    ma_headers = ["Requisito", "RN01\n(Ag.)", "RN02\n(LGPD)", "RN03\n(Lot.)", "RN04\n(Tax.)", "RN05\n(Rep.)", "RN06\n(Mulh.)", "RN07\n(Juiz)", "RN08\n(Den.)", "RN09\n(Súm.)"]
    for idx, h in enumerate(ma_headers):
        t_ma.rows[0].cells[idx].paragraphs[0].add_run(h).bold = True
        set_cell_shading(t_ma.rows[0].cells[idx], "E2E8F0")

    ma_rows = [
        ("RF004 (Mapa PostGIS)", "", "X", "", "", "", "X", "", "", ""),
        ("RF005 (Filtro Feminino)", "", "X", "", "", "", "X", "", "", ""),
        ("RF006 (Amistosos / Vagas)", "", "", "", "X", "", "", "X", "", "X"),
        ("RF007 (Precificação / Taxas)", "", "", "", "X", "", "", "X", "", ""),
        ("RF008 (Status Partida)", "", "", "X", "", "", "", "", "", "X"),
        ("RF009 (Painel Anfitrião)", "", "", "", "", "X", "", "", "", ""),
        ("RF010 (Chat WebSocket)", "", "X", "", "", "", "X", "", "", ""),
        ("RF011 (Avaliação 360°)", "", "", "", "", "X", "", "X", "", ""),
        ("RF013 (Súmula Digital)", "", "", "", "", "", "", "", "", "X"),
        ("RF015 (Canal Denúncias)", "", "", "", "", "X", "X", "", "X", "")
    ]
    for i, r_vals in enumerate(ma_rows):
        row = t_ma.rows[i+1]
        for j, val in enumerate(r_vals):
            c = row.cells[j]
            c.paragraphs[0].add_run(val)
            c.paragraphs[0].paragraph_format.line_spacing = 1.0
            if j == 0:
                c.paragraphs[0].runs[0].bold = True
            else:
                c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            set_cell_margins(c)

    # 3.12 MER e DER PostGIS
    p_der_tit = doc.add_paragraph()
    r_der = p_der_tit.add_run("\n3.12 Modelagem de Dados: MER e DER PostGIS (10 Tabelas)")
    r_der.bold = True
    r_der.font.size = Pt(13)

    p_der_desc = doc.add_paragraph()
    p_der_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_der_desc.add_run(
        "O schema físico em PostgreSQL 16 + PostGIS é composto por dez tabelas estruturadas: "
        "usuario (trava de CPF/e-mail), codigo_verificacao_email (OTP), juiz_federado (RN07), "
        "partida (PostGIS geography POINT 4326, taxa_campo, taxa_juiz e filtro_genero RN06), solicitacao (vagas), "
        "avaliacao_atleta (notas 1 a 5 estrelas), avaliacao_jogo_local (local, clima de fair play e árbitro), "
        "sumula_partida (gols, substituições e MVP - RN09), denuncia (machismo, racismo, homofobia - RN08), "
        "chat_mensagem (WebSocket) e auditoria_log (imutável LGPD)."
    )

    doc.add_page_break()

    # ----------------------------------------------------
    # 4 FERRAMENTAS E MÉTODOS
    # ----------------------------------------------------
    p_sec4 = doc.add_paragraph()
    r_s4 = p_sec4.add_run("4 Ferramentas e Métodos")
    r_s4.bold = True
    r_s4.font.size = Pt(14)
    r_s4.font.color.rgb = primary_color

    p_q_ferr_lbl = doc.add_paragraph()
    p_q_ferr_lbl.add_run("Quadro 19 – Ferramentas e Tecnologias Adotadas").bold = True

    t_ferr = doc.add_table(rows=8, cols=4)
    t_ferr.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_f = t_ferr.rows[0]
    for idx, h in enumerate(["Ferramenta / Stack", "Versão", "Tipo de Licença", "Justificativa Técnica"]):
        hdr_f.cells[idx].paragraphs[0].add_run(h).bold = True
        set_cell_shading(hdr_f.cells[idx], "E2E8F0")

    ferr_items = [
        ("Node.js / Fastify", "v20+ / v4.x", "MIT (Open Source)", "Servidor HTTP de altíssimo throughput e suporte nativo a schemas JSON assíncronos."),
        ("TypeScript", "v5.3+", "Apache 2.0", "Garante tipagem estrita de ponta a ponta, segurança em tempo de compilação e refatoração segura."),
        ("PostgreSQL + PostGIS", "16 / 3.4", "PostgreSQL License", "Padrão mundial para dados geoespaciais com índices GiST e cálculos esferoidais ST_DWithin."),
        ("React + Vite", "18.x / 5.x", "MIT", "Biblioteca reativa componentizada de alta performance para renderização SPA rápida no cliente."),
        ("Material UI (MUI)", "v5.x", "MIT", "Design System robusto e acessível (WCAG) com tema oficial Bora! (#0066FF e #FFD700)."),
        ("Docker & Compose", "v24+", "Apache 2.0", "Conteinerização universal do banco de dados e garantia de reprodutibilidade em qualquer ambiente."),
        ("Jest", "v29.x", "MIT", "Framework de testes unitários automatizados para cobertura completa das regras de negócio RN01 a RN09.")
    ]
    for i, (f, v, l, j) in enumerate(ferr_items):
        row = t_ferr.rows[i+1]
        c1, c2, c3, c4 = row.cells
        c1.width = Inches(1.8)
        c2.width = Inches(0.9)
        c3.width = Inches(1.3)
        c4.width = Inches(2.7)
        c1.paragraphs[0].add_run(f).bold = True
        c2.paragraphs[0].add_run(v)
        c3.paragraphs[0].add_run(l)
        c4.paragraphs[0].add_run(j)
        for c in [c1, c2, c3, c4]:
            c.paragraphs[0].paragraph_format.line_spacing = 1.0
            set_cell_margins(c)

    # ----------------------------------------------------
    # 5 DESENVOLVIMENTO
    # ----------------------------------------------------
    p_sec5 = doc.add_paragraph()
    r_s5 = p_sec5.add_run("\n5 Desenvolvimento e Arquitetura de Software")
    r_s5.bold = True
    r_s5.font.size = Pt(14)
    r_s5.font.color.rgb = primary_color

    p_dev_desc = doc.add_paragraph()
    p_dev_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_dev_desc.add_run(
        "O desenvolvimento do Bora! App adota rigorosamente os princípios de Clean Architecture (MARTIN, 2019) e SOLID em quatro camadas concêntricas: "
        "(1) Domínio (entidades puras sem dependências externas); "
        "(2) Aplicação (Casos de Uso UC001 a UC010 orquestrando as regras RN01 a RN09); "
        "(3) Apresentação (Controladores Fastify, Schemas Zod e WebSockets); e "
        "(4) Infraestrutura (Repositórios PostgreSQL/PostGIS, Bcrypt e workers assíncronos). "
        "A interface gráfica foi prototipada e implementada em fidelidade alta (Hi-Fi) com Material UI, contemplando fluxos de autenticação com trava de CPF, "
        "mapa geoespacial com blindagem feminina, súmulas digitais, chat em tempo real e formulários de denúncia rápida contra discriminação."
    )

    # ----------------------------------------------------
    # 6 RESULTADOS E DISCUSSÃO
    # ----------------------------------------------------
    p_sec6 = doc.add_paragraph()
    r_s6 = p_sec6.add_run("\n6 Resultados e Discussão")
    r_s6.bold = True
    r_s6.font.size = Pt(14)
    r_s6.font.color.rgb = primary_color

    p_res_desc = doc.add_paragraph()
    p_res_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_res_desc.add_run(
        "Os testes unitários e de integração executados no backend aprovaram 100% dos cenários de teste automatizados (45 testes de casos de uso), "
        "comprovando a eficácia da trava anti-conflito de agenda (RN01), da precificação justa de espaços e arbitragem (RN04), da moderação automática por nota média (RN05), "
        "da blindagem de partidas femininas (RN06), da gestão de arbitragem (RN07), do canal de denúncias (RN08) e da súmula consensual (RN09). "
        "O esforço de desenvolvimento totalizou 250 horas técnicas estimadas em R$ 20.000,00, com custo de operação em nuvem de ~R$ 450,00/mês."
    )

    # ----------------------------------------------------
    # CONSIDERAÇÕES FINAIS
    # ----------------------------------------------------
    p_cf_tit = doc.add_paragraph()
    r_cf = p_cf_tit.add_run("\nConsiderações Finais")
    r_cf.bold = True
    r_cf.font.size = Pt(14)
    r_cf.font.color.rgb = primary_color

    p_cf_desc = doc.add_paragraph()
    p_cf_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_cf_desc.add_run(
        "O presente trabalho de graduação atingiu com êxito todos os objetivos inicialmente estabelecidos para a disciplina de Engenharia de Software III. "
        "O Bora! App consolida-se como uma social tech capaz de mitigar o isolamento social e o sedentarismo, aliando inteligência geoespacial à segurança de dados, "
        "conformidade estrita com a LGPD e ao compliance ético. "
        "O modelo de avaliação estilo Uber, a blindagem feminina (RN06) e a ouvidoria com banimento para atitudes discriminatórias (RN08) "
        "posicionam a aplicação como uma referência de software com responsabilidade social e integridade esportiva."
    )

    doc.add_page_break()

    # ----------------------------------------------------
    # REFERÊNCIAS BIBLIOGRÁFICAS (ABNT NBR 6023)
    # ----------------------------------------------------
    p_ref_tit = doc.add_paragraph()
    r_ref = p_ref_tit.add_run("Referências")
    r_ref.bold = True
    r_ref.font.size = Pt(14)
    r_ref.font.color.rgb = primary_color

    refs = [
        "BOOCH, Grady; RUMBAUGH, James; JACOBSON, Ivar. <b>UML: guia do usuário</b>. 2. ed. Rio de Janeiro: Elsevier, 2012.",
        "BRASIL. <b>Lei nº 13.709, de 14 de agosto de 2018</b>. Lei Geral de Proteção de Dados Pessoais (LGPD). Brasília, DF: Presidência da República, 2018.",
        "CHIAVENATO, Idalberto. <b>Planejamento estratégico: fundamentos e aplicações</b>. 4. ed. São Paulo: Atlas, 2021.",
        "DATE, Chris J. <b>Introdução a sistemas de bancos de dados</b>. 8. ed. Rio de Janeiro: Elsevier, 2004.",
        "DAYCHOUM, Merhi. <b>40 ferramentas e técnicas de gerenciamento</b>. 6. ed. Rio de Janeiro: Brasport, 2018.",
        "DUMAS, Marlon et al. <b>Fundamentals of Business Process Management</b>. 2. ed. Berlin: Springer, 2018.",
        "ELMASRI, Ramez; NAVATHE, Shamkant B. <b>Sistemas de banco de dados</b>. 6. ed. São Paulo: Pearson Addison Wesley, 2011.",
        "FOWLER, Martin. <b>UML Essencial: um breve guia para a linguagem padrão de modelagem de objetos</b>. 3. ed. Porto Alegre: Bookman, 2014.",
        "JACOBSON, Ivar. <b>Object-oriented software engineering: a use case driven approach</b>. Boston: Addison-Wesley, 2011.",
        "KERZNER, Harold. <b>Project management: a systems approach to planning, scheduling, and controlling</b>. 12. ed. Hoboken: John Wiley & Sons, 2017.",
        "KOTLER, Philip; KELLER, Kevin Lane. <b>Administração de marketing</b>. 15. ed. São Paulo: Pearson, 2018.",
        "MARTIN, Robert C. <b>Arquitetura Limpa: o guia do artesão para estrutura e design de software</b>. Rio de Janeiro: Alta Books, 2019.",
        "OBJECT MANAGEMENT GROUP (OMG). <b>Business Process Model and Notation (BPMN)</b>, Version 2.0.2. Needham: OMG, 2014.",
        "ORGANIZAÇÃO MUNDIAL DA SAÚDE (OMS). <b>Diretrizes da OMS sobre atividade física e comportamento sedentário</b>. Genebra: OMS, 2020.",
        "OSTERWALDER, Alexander; PIGNEUR, Yves. <b>Business Model Generation: inovação em modelos de negócios</b>. Rio de Janeiro: Alta Books, 2011.",
        "PRESSMAN, Roger S.; MAXIM, Bruce R. <b>Engenharia de software: uma abordagem profissional</b>. 9. ed. Porto Alegre: McGraw-Hill / AMGH, 2021.",
        "PROJECT MANAGEMENT INSTITUTE (PMI). <b>A Guide to the Project Management Body of Knowledge (PMBOK Guide)</b>. 7. ed. Newtown Square: PMI, 2021.",
        "SOMMERVILLE, Ian. <b>Engenharia de software</b>. 10. ed. São Paulo: Pearson, 2019."
    ]

    for rf in refs:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.line_spacing = 1.0
        p_r.paragraph_format.space_after = Pt(6)
        parts = rf.split("<b>")
        for part in parts:
            if "</b>" in part:
                bold_txt, regular_txt = part.split("</b>")
                p_r.add_run(bold_txt).bold = True
                p_r.add_run(regular_txt)
            else:
                p_r.add_run(part)

    # ----------------------------------------------------
    # APÊNDICES
    # ----------------------------------------------------
    doc.add_page_break()

    p_ap1_tit = doc.add_paragraph()
    r_ap1 = p_ap1_tit.add_run("Apêndice 1 — Declaração Formal de Missão, Visão e Valores")
    r_ap1.bold = True
    r_ap1.font.size = Pt(13)
    r_ap1.font.color.rgb = primary_color

    p_ap1_txt = doc.add_paragraph()
    p_ap1_txt.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_ap1_txt.add_run(
        "• <b>Missão:</b> Conectar praticantes de esportes amadores por geolocalização com alta segurança, reputação 360°, proteção feminina e tolerância zero a discriminação.\n"
        "• <b>Visão:</b> Plataforma líder nacional em integração esportiva comunitária e organização de amistosos amadores no Brasil até 2027.\n"
        "• <b>Valores:</b> Segurança e Proteção Feminina, Ética e Diversidade (Tolerância Zero), Espírito Esportivo/Fair Play, Comunidade e Transparência."
    )

    p_ap2_tit = doc.add_paragraph()
    r_ap2 = p_ap2_tit.add_run("\nApêndice 2 — Roteiro de Elicitação de Requisitos 100% Anônimo (Conformidade LGPD)")
    r_ap2.bold = True
    r_ap2.font.size = Pt(13)
    r_ap2.font.color.rgb = primary_color

    p_ap2_txt = doc.add_paragraph()
    p_ap2_txt.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_ap2_txt.add_run(
        "<i>Nota Metodológica e Ética (LGPD): Em conformidade com o Art. 6º, III da Lei nº 13.709/2018 (Minimização de Dados), "
        "este questionário é estritamente anônimo. Não são coletados nomes, endereços IP, e-mails ou números de telefone dos respondentes, "
        "garantindo total liberdade e sinceridade nas respostas sobre segurança pública, assédio e conduta esportiva.</i>\n\n"
        "<b>Bloco 1: Perfil do Praticante, Modalidades e Deslocamento Espacial</b>\n"
        "1. Qual sua faixa etária? — ( ) Menor de 18 anos  ( ) 18 a 25 anos  ( ) 26 a 35 anos  ( ) 36 a 45 anos  ( ) Mais de 45 anos.\n"
        "2. Quais esportes você pratica ou gostaria de praticar com maior frequência? — [ ] Futebol de Campo / Society  [ ] Futsal  [ ] Basquete  [ ] Vôlei / Futevôlei  [ ] Beach Tennis / Tênis  [ ] Handebol  [ ] Outro.\n"
        "3. Qual é o maior obstáculo para você praticar esportes atualmente? — ( ) Falta de companhia / time incompleto  ( ) Dificuldade de encontrar locais e horários disponíveis  ( ) Insegurança ou medo de conflitos com desconhecidos  ( ) Falta de tempo.\n"
        "4. Até que distância da sua residência você estaria disposto(a) a se deslocar para participar de uma partida? — ( ) Até 2 km (Caminhada / Bairro)  ( ) Até 5 km (Deslocamento padrão)  ( ) Até 10 km  ( ) Mais de 10 km / Qualquer região da cidade.\n\n"
        "<b>Bloco 2: Recorte de Gênero e Segurança Feminina (Com Ramificação Lógica)</b>\n"
        "5. Como você se identifica em relação ao seu gênero? — ( ) Feminino  ( ) Masculino  ( ) Outro / Prefiro não informar.\n"
        "   <i>[Se respondeu 'Feminino' → Direciona para as questões 6 e 7; caso contrário, avança para a questão 8]</i>\n"
        "6. [Exclusivo para Mulheres] Você já deixou de praticar esportes em praças ou quadras públicas por medo de assédio, importunação ou insegurança? — ( ) Sim, com frequência  ( ) Sim, às vezes  ( ) Não, nunca passei por isso.\n"
        "7. [Exclusivo para Mulheres] Você considera importante que partidas exclusivas para mulheres tenham mapa e localização blindados/ocultos para homens para garantir sua segurança física (RN06)? — ( ) Indispensável / Muito importante  ( ) Pouco importante  ( ) Indiferente.\n\n"
        "<b>Bloco 3: Reputação Mútua (Uber 360°) e Avaliação de Clima do Jogo</b>\n"
        "8. O que você acha de um sistema onde o anfitrião avalia a nota do jogador antes de aceitá-lo e todos avaliam o comportamento e pontualidade uns dos outros pós-jogo (1 a 5 estrelas)? — ( ) Essencial (evita atletas descompromissados ou violentos)  ( ) Útil  ( ) Desnecessário.\n"
        "9. Além dos jogadores, você considera relevante avaliar a organização do anfitrião, as condições da quadra/local, a atuação do árbitro e o 'Clima do Jogo' (se o pessoal jogou com espírito esportivo ou com estresse/brigas)? — ( ) Sim, ajuda muito a escolher jogos saudáveis e bons locais  ( ) Apenas avaliar os atletas  ( ) Indiferente.\n\n"
        "<b>Bloco 4: Amistosos Estruturados, Súmulas Oficiais e Perfil de Arbitragem</b>\n"
        "10. Em confrontos entre equipes formadas (Amistosos), você apoia o registro de uma Súmula Digital oficial (placar, gols marcados, substituições e craque do jogo) validada por ambos os capitães (RN09)? — ( ) Sim, traz seriedade e histórico ao time  ( ) Não vejo necessidade.\n"
        "11. Quando houver cobrança de taxa de arbitragem em amistosos, qual o perfil de árbitro você prefere que o aplicativo ofereça (RN07)? — ( ) Árbitros experientes avaliados pela comunidade (não precisa ser federado, desde que tenha boa nota)  ( ) Apenas Árbitros Federados oficiais com registro comprovado  ( ) Ambos (permitir ao anfitrião escolher)  ( ) Não faço questão de árbitro.\n\n"
        "<b>Bloco 5: Compliance Ético e Tolerância Zero contra Discriminação</b>\n"
        "12. Você apoia a existência de um botão de denúncia ágil com suspensão e BANIMENTO definitivo da plataforma para atletas envolvidos em casos comprovados de machismo, racismo, homofobia ou agressão física (RN08)? — ( ) Apoio totalmente (Tolerância Zero)  ( ) Apenas advertência  ( ) Não apoio."
    )

    docx_path = os.path.join(os.path.dirname(__file__), "TG_Bora_App_FATEC_Franca.docx")
    doc.save(docx_path)
    print(f"Documento Word (.docx) gerado com sucesso em: {docx_path}")

if __name__ == "__main__":
    create_document()
