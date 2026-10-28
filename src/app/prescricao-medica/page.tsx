import { Aviso } from "@/components/campos";

// Módulo ainda não construído. Esta página registra o escopo combinado para a próxima etapa.

export default function PrescricaoMedicaPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Prescrição médica e medicação</h1>
      <Aviso tipo="alerta">Módulo em construção. A SAE e a admissão já usam os mesmos plantões e regras de checagem que serão aplicados aqui.</Aviso>
      <section className="flex flex-col gap-2 rounded-xl border p-4 text-sm">
        <h2 className="font-semibold">Escopo previsto</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Prescrição pelo médico: medicamento, dose, via, horários, período; “se necessário” (SOS).</li>
          <li>Sem edição: suspender (com motivo) e renovar (cria nova prescrição pré-preenchida).</li>
          <li>Reconciliação na admissão a partir da lista “medicamentos em uso”.</li>
          <li>Aprazamento por plantão e checagem: administrado / não administrado (motivo obrigatório) / atrasado; checagem dupla bloqueada.</li>
          <li>Alergias em destaque na prescrição e na checagem.</li>
          <li>Aviso fixo: prescrição interna para aprazamento, não substitui receituário (Portaria SVS/MS 344/98).</li>
        </ul>
        <p className="text-muted-foreground">
          O projeto anterior (<code>pront-asilo-modelo</code>) já tem a lógica de horário do dia e checagem de medicação com testes, que pode ser reaproveitada.
        </p>
      </section>
    </div>
  );
}
