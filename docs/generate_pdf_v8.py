import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether, HRFlowable, Preformatted
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return
        
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0066FF"))
        
        # Cabeçalho
        self.drawString(40, A4[1] - 30, "BORA! APP — ARTEFATOS DE ENGENHARIA DE SOFTWARE III (V8.2)")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(A4[0] - 40, A4[1] - 30, "FATEC FRANCA — ADS (2026)")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(40, A4[1] - 35, A4[0] - 40, A4[1] - 35)
        
        # Rodapé
        self.line(40, 42, A4[0] - 40, 42)
        self.drawString(40, 30, "Trabalho de Graduação (TG) — Renata Saraiva Claudino & Leonardo Lopes dos Santos")
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(A4[0] - 40, 30, page_str)
        self.restoreState()

def build_pdf():
    pdf_path = os.path.join(os.path.dirname(__file__), "Artefatos_ESO3_Bora_App_v8.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    primary_color = colors.HexColor("#0066FF")
    secondary_color = colors.HexColor("#FFD700")
    dark_slate = colors.HexColor("#0F172A")
    body_color = colors.HexColor("#334155")
    bg_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=25,
        textColor=primary_color,
        alignment=1
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=dark_slate,
        alignment=1
    )

    cover_meta = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=dark_slate,
        alignment=1
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14.5,
        textColor=dark_slate,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Header3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12.5,
        textColor=primary_color,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=body_color,
        alignment=4,
        spaceAfter=3.5
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=body_color,
        leftIndent=10,
        spaceAfter=2
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.5,
        leading=8.2,
        textColor=colors.HexColor("#0F172A")
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E3A8A"),
        backColor=colors.HexColor("#EFF6FF"),
        borderColor=primary_color,
        borderWidth=1,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6
    )

    story = []

    # ================= CAPA =================
    story.append(Spacer(1, 25))
    story.append(Paragraph("<b>FACULDADE DE TECNOLOGIA DE FRANCA</b>", cover_meta))
    story.append(Paragraph("<b>DR. THOMAZ NOVELINO (FATEC FRANCA)</b>", cover_meta))
    story.append(Paragraph("Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas (ADS)", cover_meta))
    story.append(Paragraph("5º Semestre — Trabalho de Graduação (TG) / Engenharia de Software III", cover_meta))
    story.append(Spacer(1, 30))

    logo_path = os.path.join(os.path.dirname(__file__), "Bora!", "BoraLogo.png")
    if os.path.exists(logo_path):
        story.append(Image(logo_path, width=110, height=110))
        story.append(Spacer(1, 15))

    story.append(Paragraph("<b>Bora! App — Social Tech de Conexão Esportiva, Reputação Mútua, Gestão de Amistosos, Segurança Feminina & Compliance Ético</b>", title_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Documento Oficial de Artefatos de Engenharia de Software III — Versão 8.2</b>", subtitle_style))
    story.append(Spacer(1, 45))

    story.append(Paragraph("<b>Autores (Equipe Discente):</b><br/><b>Renata Saraiva Claudino</b> — <i>Líder de Projeto, Engenharia de Requisitos, Prototipação UI/UX & Identidade Visual</i><br/><b>Leonardo Lopes dos Santos</b> — <i>Arquitetura de Software, Backend, Modelagem de Dados & Regras de Negócio</i>", cover_meta))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Orientação Técnica e Acadêmica:</b><br/>Prof. Me. Carlos Eduardo de França Roland", cover_meta))
    story.append(Spacer(1, 25))
    story.append(Paragraph("Franca — SP<br/>2026", cover_meta))
    story.append(PageBreak())

    # ================= SEÇÃO 1: INTRODUÇÃO E VALORES =================
    story.append(Paragraph("1. Missão, Visão, Valores e Proposta de Valor Social", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=6))
    
    story.append(Paragraph("<b>1.1. Missão</b>", h2_style))
    story.append(Paragraph("Transformar a busca individual por exercício em encontros coletivos e saudáveis, conectando praticantes de esportes e equipes amadoras por geolocalização com base em reputação mútua multidimensional (estilo Uber), blindagem para mulheres (RN06), arbitragem qualificada e compliance com canal de denúncias contra preconceitos.", body_style))

    story.append(Paragraph("<b>1.2. Proposta de Valor e Pilares Inovadores</b>", h2_style))
    story.append(Paragraph("<b>1. Reputação 360° Multidimensional:</b> Avaliação de atletas, anfitrião, qualidade do local, clima esportivo (fair play vs estresse) e da arbitragem.<br/>"
                           "<b>2. Espaço Seguro Feminino (RN06):</b> Partidas femininas possuem blindagem no mapa, sendo ocultas para homens para evitar assédio.<br/>"
                           "<b>3. Súmula Digital Consensual e Arbitragem Qualificada (RN07/RN09):</b> Registro oficial de gols, substituições e MVP validado por ambos os times.<br/>"
                           "<b>4. Compliance Ético e LGPD (RN08):</b> Botão de denúncia direta contra machismo, racismo e LGBTfobia com banimento sumário e pesquisa 100% anônima.", callout_style))

    story.append(Paragraph("<b>1.3. Valores Corporativos</b>", h2_style))
    story.append(Paragraph("• <b>Segurança e Proteção Feminina:</b> Tolerância zero ao assédio e garantia de ambientes acolhedores para mulheres.", bullet_style))
    story.append(Paragraph("• <b>Ética e Diversidade:</b> Combate intransigente a qualquer forma de preconceito e violência física/verbal.", bullet_style))
    story.append(Paragraph("• <b>Espírito Esportivo e Fair Play:</b> Valorização da disciplina e combate a atitudes antidesportivas.", bullet_style))
    story.append(Paragraph("• <b>Transparência e Conformidade LGPD:</b> Privacidade por design, gratuidade em espaços públicos e anonimato garantido.", bullet_style))

    story.append(Spacer(1, 6))

    # ================= SEÇÃO 2: REQUISITOS E REGRAS =================
    story.append(Paragraph("2. Requisitos do Sistema e Regras de Negócio Fundamentais", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=6))
    
    story.append(Paragraph("<b>2.1. Requisitos Funcionais Principais (RF)</b>", h2_style))
    rfs = [
        "<b>RF01:</b> Cadastro de usuários com trava dupla de CPF (Módulo 11) e e-mail único com senha Bcrypt.",
        "<b>RF02:</b> Validação de e-mail via código OTP de 6 dígitos temporário (10 min).",
        "<b>RF04:</b> Plotagem de partidas no mapa por raio configurável (1 a 30 km) via PostGIS.",
        "<b>RF05:</b> Filtro e blindagem para 'Exclusivo Feminino' ocultando partidas para o público masculino (RN06).",
        "<b>RF06/RF07:</b> Gestão de partidas avulsas e amistosos com gratuidade pública e taxa de juiz 50/50 (RN04).",
        "<b>RF10:</b> Sala de Chat em tempo real via WebSocket exclusiva para participantes confirmados.",
        "<b>RF11:</b> Avaliação Multidimensional 360° (atletas, anfitrião, local, clima esportivo e arbitragem).",
        "<b>RF13:</b> Súmula Digital Consensual com placar, gols, substituições e MVP (RN09).",
        "<b>RF14:</b> Módulo de Arbitragem Qualificada (Comunitária e Federada Homologada - RN07).",
        "<b>RF15:</b> Canal de Denúncias contra Machismo, Racismo e Homofobia com protocolo de banimento (RN08)."
    ]
    for rf in rfs:
        story.append(Paragraph(rf, bullet_style))

    story.append(Paragraph("<b>2.2. Regras de Negócio Centrais (RN)</b>", h2_style))
    rns = [
        "<b>RN01 (Anti-conflito de Agenda):</b> Bloqueia partidas simultâneas na janela de ±2 horas.",
        "<b>RN02 (Privacidade Espacial LGPD):</b> Coordenadas exatas permanecem ofuscadas até o aceite formal.",
        "<b>RN03 (Trava de Cancelamento):</b> Bloqueia cancelamento direto em partidas no estado 'Lotada'.",
        "<b>RN04 (Precificação e Arbitragem):</b> Quadras públicas têm taxa = R$ 0,00; taxa de juiz é dividida 50/50 em amistosos.",
        "<b>RN05 (Moderação por Reputação):</b> Nota média < 2.0 (com 5+ avaliações) acarreta suspensão automática.",
        "<b>RN06 (Espaço Seguro Feminino):</b> Eventos femininos são 100% invisíveis no mapa para usuários masculinos.",
        "<b>RN07 (Arbitragem Qualificada):</b> Suporte a juízes comunitários avaliados e federados homologados com selo.",
        "<b>RN08 (Tolerância Zero):</b> Denúncias comprovadas de machismo, racismo ou homofobia geram banimento definitivo.",
        "<b>RN09 (Súmula Consensual):</b> O resumo de gols e substituições exige confirmação do capitão adversário."
    ]
    for rn in rns:
        story.append(Paragraph(rn, bullet_style))

    story.append(PageBreak())

    # ================= SEÇÃO 3: CASOS DE USO =================
    story.append(Paragraph("3. Especificação de Casos de Uso (UC001 a UC010)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=6))

    ucs_specs = [
        ("UC001 — Gerenciar Perfil e Autenticação com Trava Dupla", "Jogador / Organizador",
         "1. Informa Nome, CPF, E-mail, Gênero e Senha.\n2. Valida CPF (Módulo 11) e OTP de 6 dígitos.\n3. Ativa perfil com modalidades e foto."),
        ("UC002 — Consultar Mapa com Blindagem Feminina (RN06)", "Jogador / Organizador",
         "1. Captura GPS e executa ST_DWithin no PostGIS.\n2. Suprime partidas femininas se o usuário for homem.\n3. Exibe alfinetes e nota do anfitrião."),
        ("UC003 — Cadastrar Partida / Desafio de Amistoso", "Organizador / Capitão",
         "1. Define esporte, formato, gênero e local.\n2. Aplica RN04 de taxas e escala árbitro comunitário ou federado (RN07).\n3. Persiste partida como 'Publicada'."),
        ("UC004 — Solicitar Participação em Partida", "Jogador solicitante",
         "1. Solicita vaga.\n2. Valida RN01 (anti-conflito de 2h) e RN06 (gênero).\n3. Grava como 'Pendente' e notifica anfitrião."),
        ("UC005 — Avaliar Reputação Multidimensional (Uber 360°)", "Participantes da partida",
         "1. Avalia atletas (conduta/pontualidade), anfitrião, local/quadra, clima esportivo e arbitragem.\n2. Recalcula médias e aplica RN05 se < 2.0."),
        ("UC006 — Gerenciar Solicitações (Painel do Anfitrião)", "Organizador da Partida",
         "1. Analisa foto, histórico e nota média de conduta do atleta.\n2. Aceita ou recusa. Ao aceitar, libera rota GPS e chat."),
        ("UC007 — Interagir no Chat da Partida em Tempo Real", "Organizador e Atletas",
         "1. Conexão WebSocket na sala exclusiva.\n2. Troca instantânea de mensagens de alinhamento tático e caronas."),
        ("UC008 — Gerenciar Súmula Digital Consensual (RN09)", "Juiz / Anfitrião e Capitão",
         "1. Preenche placar, autores de gols, substituições e MVP.\n2. Capitão adversário valida e homologa os dados estatísticos."),
        ("UC009 — Registrar Denúncia Ética e Compliance (RN08)", "Qualquer participante",
         "1. Seleciona categoria: Machismo, Racismo, Homofobia ou Agressão.\n2. Anexa relato e provas.\n3. Moderação aplica suspensão preventiva e banimento."),
        ("UC010 — Homologar Cadastro e Perfil de Arbitragem (RN07)", "Árbitro e Moderação",
         "1. Envia histórico ou comprovante de registro federativo.\n2. Moderação valida e habilita perfil comunitário ou selo federado oficial.")
    ]

    for uc_title, ator, fluxo in ucs_specs:
        story.append(Paragraph(f"<b>{uc_title}</b>", h3_style))
        story.append(Paragraph(f"<b>Atores:</b> {ator}", body_style))
        story.append(Paragraph(f"<b>Fluxo:</b> {fluxo.replace(chr(10), '<br/>')}", body_style))
        story.append(Spacer(1, 3))

    story.append(PageBreak())

    # ================= SEÇÃO 4: MODELAGEM DE DADOS POSTGIS (10 TABELAS) =================
    story.append(Paragraph("4. Modelagem Física de Dados PostGIS (10 Tabelas Estruturadas)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=6))

    ddl_lines = """-- 1. Extensões e Tipos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TYPE tipo_status_usuario AS ENUM ('Pendente_Validacao', 'Ativo', 'Suspenso', 'Banido');
CREATE TYPE tipo_status_partida AS ENUM ('Rascunho', 'Publicada', 'Lotada', 'Em_Andamento', 'Finalizada', 'Cancelada');
CREATE TYPE tipo_status_solicitacao AS ENUM ('Pendente', 'Em_Analise', 'Aprovada', 'Rejeitada', 'Cancelada');
CREATE TYPE tipo_categoria_denuncia AS ENUM ('Machismo_Assedio', 'Racismo_Injuria', 'Homofobia_Transfobia', 'Violencia_Agressao', 'Outros');

-- 2. Tabela de Usuários
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NULL,
    senha_hash VARCHAR(255) NOT NULL,
    genero VARCHAR(50) NOT NULL,
    nota_media DECIMAL(3,2) DEFAULT 5.00 NOT NULL,
    status_usuario tipo_status_usuario DEFAULT 'Pendente_Validacao' NOT NULL,
    deletado_em TIMESTAMP WITH TIME ZONE NULL
);
CREATE UNIQUE INDEX idx_usuario_cpf ON usuario(cpf) WHERE deletado_em IS NULL AND cpf IS NOT NULL;

-- 3. Tabela de Juízes e Arbitragem Qualificada (RN07)
CREATE TABLE juiz_federado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    tipo_arbitro VARCHAR(30) DEFAULT 'Comunitario' NOT NULL, -- 'Comunitario' ou 'Federado'
    numero_registro_federacao VARCHAR(50) NULL,
    federacao_nome VARCHAR(120) NULL,
    status_homologacao VARCHAR(30) DEFAULT 'Homologado' NOT NULL
);

-- 4. Tabela de Partidas & Amistosos (PostGIS + RN04 + RN06 + RN07)
CREATE TABLE partida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizador_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    juiz_id UUID NULL REFERENCES juiz_federado(id),
    esporte VARCHAR(80) NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    duracao_minutos INTEGER DEFAULT 90 NOT NULL,
    max_vagas INTEGER NOT NULL CHECK (max_vagas > 1),
    tipo_local VARCHAR(20) DEFAULT 'Publica' NOT NULL,
    formato_jogo VARCHAR(30) DEFAULT 'Avulso' NOT NULL,
    taxa_campo DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    taxa_juiz DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    filtro_genero VARCHAR(50) DEFAULT 'Misto' NOT NULL, -- RN06: 'Exclusivo_Feminino'
    geom GEOMETRY(Point, 4326),
    status_partida tipo_status_partida DEFAULT 'Publicada' NOT NULL,
    deletado_em TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX idx_partida_geom_gist ON partida USING GIST(geom);
CREATE INDEX idx_partida_genero ON partida(filtro_genero);

-- 5. Tabelas de Avaliações Multidimensionais (Atleta, Local, Clima, Juiz)
CREATE TABLE avaliacao_atleta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    avaliador_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    avaliado_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    nota_conduta INTEGER NOT NULL CHECK (nota_conduta BETWEEN 1 AND 5),
    nota_pontualidade INTEGER NOT NULL CHECK (nota_pontualidade BETWEEN 1 AND 5)
);

CREATE TABLE avaliacao_jogo_local (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    avaliador_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    nota_organizador INTEGER NOT NULL CHECK (nota_organizador BETWEEN 1 AND 5),
    nota_local_quadra INTEGER NOT NULL CHECK (nota_local_quadra BETWEEN 1 AND 5),
    nota_clima_esportivo INTEGER NOT NULL CHECK (nota_clima_esportivo BETWEEN 1 AND 5),
    nota_juiz INTEGER NULL CHECK (nota_juiz BETWEEN 1 AND 5)
);

-- 6. Tabela de Súmula Digital Consensual (RN09)
CREATE TABLE sumula_partida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID UNIQUE NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    placar_mandante INTEGER DEFAULT 0 NOT NULL,
    placar_visitante INTEGER DEFAULT 0 NOT NULL,
    gols_pontos JSONB DEFAULT '[]'::jsonb NOT NULL,
    substituicoes JSONB DEFAULT '[]'::jsonb NOT NULL,
    mvp_atleta_id UUID NULL REFERENCES usuario(id),
    confirmado_adversario BOOLEAN DEFAULT FALSE NOT NULL
);

-- 7. Tabela de Denúncias Éticas e Compliance (RN08)
CREATE TABLE denuncia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    denunciante_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    denunciado_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    partida_id UUID NULL REFERENCES partida(id) ON DELETE SET NULL,
    categoria_infracao tipo_categoria_denuncia NOT NULL,
    descricao TEXT NOT NULL,
    status_denuncia VARCHAR(30) DEFAULT 'Em_Analise' NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);"""

    story.append(Preformatted(ddl_lines, code_style))
    story.append(PageBreak())

    # ================= SEÇÃO 5: TELAS E HISTÓRICO =================
    story.append(Paragraph("5. Galeria de Telas e Prototipagem do Sistema", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=6))
    
    img_folder = os.path.join(os.path.dirname(__file__), "Bora!")
    sample_images = [
        ("Login & Social Auth", "pag_login.png"),
        ("Cadastro OTP / CPF", "sing_in.png"),
        ("Mapa & Atividades", "Activities.png"),
        ("Chat em Tempo Real", "Chat.png"),
        ("Criar Partida / Amistoso", "iniciar partida.png"),
        ("Filtros de Proximidade", "filtro_pesquisa.png"),
    ]

    table_imgs = []
    row = []
    for label, filename in sample_images:
        path = os.path.join(img_folder, filename)
        if os.path.exists(path):
            cell = [
                Image(path, width=135, height=210),
                Paragraph(f"<b>{label}</b>", cover_meta)
            ]
            row.append(cell)
            if len(row) == 3:
                table_imgs.append(row)
                row = []
    if row:
        table_imgs.append(row)

    if table_imgs:
        gallery_table = Table(table_imgs, colWidths=[173, 173, 173])
        gallery_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(gallery_table)

    story.append(Spacer(1, 10))

    story.append(Paragraph("6. Histórico de Versões e Controle de Mudanças", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=6))
    
    history_data = [
        [Paragraph("<b>Versão</b>", h3_style), Paragraph("<b>Data</b>", h3_style), Paragraph("<b>Principais Modificações e Evoluções</b>", h3_style)],
        [Paragraph("<b>v5.0</b>", body_style), Paragraph("19/08/2026", body_style), Paragraph("Especificação preliminar com 6 Casos de Uso básicos e modelagem inicial.", body_style)],
        [Paragraph("<b>v7.0</b>", body_style), Paragraph("20/08/2026", body_style), Paragraph("Padronização snake_case, trava RN03 de cancelamento em partidas lotadas e protótipos Hi-Fi.", body_style)],
        [Paragraph("<b>v8.0</b>", body_style), Paragraph("24/08/2026", body_style), Paragraph("Amistosos entre Equipes, trava dupla de CPF (Módulo 11) + OTP, Chat WebSocket, Soft Delete e Auditoria Log.", body_style)],
        [Paragraph("<b>v8.1</b>", body_style), Paragraph("27/08/2026", body_style), Paragraph("Formalização da RN06 (Espaço Seguro Feminino com blindagem geoespacial no mapa).", body_style)],
        [Paragraph("<b>v8.2 (Atual)</b>", body_style), Paragraph("31/08/2026", body_style), Paragraph("<b>Versão Oficial Consolidada de Engenharia de Software III (TG):</b><br/>• Retificação dos Autores: <b>Renata Saraiva Claudino</b> e <b>Leonardo Lopes dos Santos</b>.<br/>• Conformidade com LGPD e Pesquisa de Requisitos Estritamente Anônima.<br/>• Sistema de Avaliação Multidimensional (anfitrião, clima esportivo/fair play, local, capitães e juiz).<br/>• <b>Súmula Digital Consensual (RN09)</b> e Módulo de Arbitragem Qualificada (Comunitária e Federada - RN07).<br/>• <b>Canal Oficial de Denúncias Éticas (RN08)</b> com tolerância zero e banimento para machismo, racismo e homofobia.<br/>• DDL físico expandido para 10 tabelas relacionais com PostGIS.", body_style)]
    ]
    
    hist_table = Table(history_data, colWidths=[70, 70, 380])
    hist_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E2E8F0")),
        ('BACKGROUND', (0,5), (-1,5), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(hist_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF gerado com sucesso em: {pdf_path}")

if __name__ == "__main__":
    build_pdf()
