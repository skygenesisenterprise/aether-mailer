# Contributing to Notploy

Thank you for your interest in contributing to **Notploy**!
We welcome community contributions and feedback, while the project is also maintained and developed by [Sky Genesis Enterprise](https://skygenesisenterprise.com).

---

## 📦 About the Project

**Notploy** is an open-source, self-hostable deployment platform licensed under the **MIT License**, with both:

- A **free and self-hostable version** for the open-source community
- A **commercial edition** with additional features and premium support maintained by Sky Genesis Enterprise

We value collaboration and are happy to accept pull requests, bug reports, and feature suggestions from the community.

---

## 🧭 Code of Conduct

We follow a [Code of Conduct](../CODE_OF_CONDUCT.md) to ensure a safe, respectful, and inclusive environment.
Please make sure you read and respect it before contributing.

---

## 🛠️ How to Contribute

### 1. Fork the Repository

Use the GitHub UI to create a fork, then clone it locally:

```bash
git clone https://github.com/skygenesisenterprise/notploy.git
cd notploy
```

### 2. Set Up Locally

Notploy is a pnpm monorepo and requires **Node.js 24.4+** and **pnpm 10.22+**. Install every workspace package from the repository root:

```bash
pnpm install
```

The application needs PostgreSQL. The quickest way to get a working stack is the Compose stack described in [README.md](../README.md#self-host-with-docker-compose):

```bash
docker compose up --build -d
```

For dashboard work without containers, run `pnpm dev` once PostgreSQL is reachable and `.env` is filled in from `.env.example`.

### 3. Create a Feature or Fix Branch

Follow the naming convention:

```
fix/bug-title
feature/new-feature-name
docs/update-docs-section
```

```bash
git checkout -b feature/your-feature
```

### 4. Make Your Changes

Follow the coding standards and linting rules — the workspace is formatted and linted with [Biome](https://biomejs.dev) via `pnpm lint` and `pnpm format-and-lint:fix`. Please write tests if applicable, and update documentation when necessary.

### 5. Run Tests

Ensure your code doesn't break existing functionality:

```bash
pnpm test        # vitest suite in apps/notploy
pnpm typecheck   # tsc across the workspace
pnpm lint        # biome check
```

### 6. Submit a Pull Request

Push to your fork and open a Pull Request via the GitHub UI.

* Pick the template that matches your change: [Bug fix](./PULL_REQUEST_TEMPLATE/bug_fix.md), [Feature](./PULL_REQUEST_TEMPLATE/feature.md), [Improvement](./PULL_REQUEST_TEMPLATE/improvement.md), or [Documentation](./PULL_REQUEST_TEMPLATE/documentation.md)
* Your **PR title must follow Conventional Commits** (`fix: <subject>`, `feat: <subject>`, `docs: <subject>`, …). This is a required CI check — see `.github/workflows/commitlint.yml` and `.commitlintrc`.
* If your change is user-facing, add a changeset with `pnpm changeset` so the published packages get a changelog entry
* Link to relevant issues (e.g. `Closes #123`)
* Our team will review your contribution — we may request changes

---

## 🐛 Reporting an Issue

Use one of the [issue templates](./ISSUE_TEMPLATE), which route to the right people faster:

| Template | Use it when |
| --- | --- |
| [Bug report](./ISSUE_TEMPLATE/bug_report.yml) | Something is broken, regressed, or errors out |
| [Feature request](./ISSUE_TEMPLATE/feature_request.yml) | Notploy cannot do something you need it to do |
| [Improvement](./ISSUE_TEMPLATE/improvement.yml) | It can, but it should be faster, clearer, or more reliable |
| [Documentation](./ISSUE_TEMPLATE/documentation.yml) | Docs, guides, examples, or reference pages are wrong or missing |

**Never report a security vulnerability in a public issue.** Use the private channel described in [SECURITY.md](../SECURITY.md), and never paste secrets, tokens, or credentials into any issue or pull request.

The label taxonomy used for triage is documented in [labels.yml](./labels.yml).

---

## 🧠 Contribution Scope

You may contribute in the following areas:

* ✨ New features (frontend or backend)
* 🐛 Bug fixes
* 📝 Documentation improvements
* ⚙️ Dev tooling, performance, testing
* 💬 Discussions and ideas

Please note that **final decisions regarding project direction, architecture, and priorities are made by Sky Genesis Enterprise.**

---

## 📩 Questions or Suggestions?

Open a [GitHub Issue](./ISSUE_TEMPLATE) for bugs and proposals, or join the [Notploy Discord](https://discord.gg/2tBnJ3jDJc) for questions.
You can also reach out to us at [contact@skygenesisenterprise.com](mailto:contact@skygenesisenterprise.com)

Thank you for helping improve Notploy 💌
