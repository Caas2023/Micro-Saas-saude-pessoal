# 🏥 Micro-Saas Saúde Pessoal

> [!IMPORTANT]
> **ESTE É O PROJETO SAÚDE PESSOAL.** 
> Foco: Monitoramento de exames laboratoriais e inteligência de saúde.

O **Saúde Pessoal** é uma plataforma inteligente projetada para ajudar usuários a extraírem, organizarem e visualizarem dados de seus exames médicos de forma automatizada e segura.

## 🚀 Funcionalidades Principais

### 1. 👁️ Visão IA Multimodal (OCR Inteligente)
- **Extração de Dados**: Utiliza o **Gemini 2.0 Flash** (e fallback **Pollinations**) para ler fotos de exames e extrair marcadores bioquímicos (ex: Colesterol, Glicose, Hemoglobina).
- **Schema Estrito**: Garantia de extração em formato JSON estruturado, capturando nome do marcador, valor, unidade e limites de referência.
- **Suporte Multi-Provedor**: Flexibilidade para alternar entre diferentes provedores de IA conforme a necessidade.

### 2. 📊 Monitoramento Evolutivo
- **Dashboard de Saúde**: Visão geral dos últimos exames realizados.
- **Gráficos Dinâmicos**: Visualização da evolução de cada marcador ao longo do tempo usando **Recharts**.
- **Análise de Tendência (Delta)**: Cálculo automático de variação percentual entre exames consecutivos.

### 3. 💾 Gestão de Documentos
- **Upload Seguro**: Armazenamento dos documentos originais no **Supabase Storage**.
- **Sistema de Review**: Interface dedicada para o usuário validar e corrigir os dados extraídos pela IA antes de salvar no banco de dados.

### 4. 🛡️ Segurança e Privacidade
- **Row Level Security (RLS)**: Proteção rigorosa onde cada usuário acessa exclusivamente seus próprios dados.
- **Gestão de Secrets**: Sistema de armazenamento de chaves de API globais protegidas, acessíveis apenas por administradores.
- **BYOP (Bring Your Own Provider)**: Permite que usuários avançados conectem suas próprias chaves de API para processamento.

---

## 🏗️ Arquitetura Técnica

- **Frontend**: React 19 + Vite (TypeScript).
- **Estilização**: Tailwind CSS 4 + Shadcn/ui.
- **Animações**: Framer Motion + tw-animate-css.
- **Backend/DB**: Supabase (Auth, Database, Storage).
- **IA**: @google/generative-ai + Pollinations API.
- **Estado**: Zustand + TanStack Query.

---

## 🛠️ Estrutura do Projeto

```
/
├── src/
│   ├── components/       # Componentes de UI (FileUpload, DataGrid, etc)
│   ├── services/         # Lógica de Visão (Gemini/Pollinations) e Storage
│   ├── store/            # Gerenciamento de estado (Auth)
│   ├── types/            # Definições de interfaces (ExamMarker, OCRResult)
│   └── lib/              # Utilitários e configurações (Supabase)
├── supabase_schema.sql   # Estrutura completa do banco de dados e políticas RLS
└── package.json          # Dependências e scripts
```

---
*Documentação atualizada para garantir alinhamento total de contexto.*
