import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"

const VALUES = [
  { number: "01", title: "Confiança", text: "A base de toda negociação que conduzimos." },
  { number: "02", title: "Ética", text: "Fazemos o certo, mesmo quando ninguém está olhando." },
  { number: "03", title: "Transparência", text: "Informação clara, sem surpresas no meio do caminho." },
  { number: "04", title: "Respeito", text: "Ao tempo, ao orçamento e à decisão de cada cliente." },
  { number: "05", title: "Excelência", text: "Atenção aos detalhes em cada etapa do atendimento." },
  { number: "06", title: "Compromisso", text: "Do primeiro contato até a chave na mão." },
]

// Seção intencionalmente distinta do bloco "Missão/Visão/Valores" (mais
// enxuto, 3 cards) — aqui os mesmos temas de valores ganham um tratamento
// maior e mais gráfico (numerais grandes), pedido explícito da cliente.
export function AboutValuesShowcase() {
  return (
    <section className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mb-10 text-center sm:mb-14">
          <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
            O que carregamos em cada negociação
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            Nossos <AccentWord>Valores</AccentWord>
          </h2>
        </Reveal>

        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value) => (
            <StaggerItem
              key={value.number}
              className="group relative overflow-hidden rounded-[20px] border border-border/60 bg-card p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/30 hover:ring-1 hover:ring-gold/30"
            >
              <p className="font-heading text-5xl font-bold text-gold/20 transition-colors duration-500 group-hover:text-gold/30">
                {value.number}
              </p>
              <p className="font-heading mt-2 text-2xl font-semibold">{value.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
