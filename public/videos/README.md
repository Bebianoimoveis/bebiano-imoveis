# Vídeo de fundo da Hero

Para usar um vídeo no lugar da foto de fundo da Hero, basta colocar o
arquivo aqui com o nome `hero.mp4`:

```
public/videos/hero.mp4
```

O componente (`src/components/public/hero-background.tsx`) já está pronto
para isso — nenhuma mudança de código é necessária. Se o arquivo não
existir, o site continua normalmente com a foto atual (`hero-team.jpg`)
como fundo, sem erro nenhum.

## Recomendações técnicas

- **Formato**: MP4 (codec H.264) — o mais compatível entre navegadores.
- **Duração**: 10-20s, em loop (o vídeo repete automaticamente).
- **Sem áudio necessário**: o vídeo toca sempre mudo (autoplay em
  navegador exige isso).
- **Resolução**: 1920×1080 é suficiente — não precisa de 4K, só aumenta o
  tempo de carregamento sem ganho visual perceptível como fundo.
- **Tamanho do arquivo**: procure ficar abaixo de 8-10MB (comprima com
  `ffmpeg -crf 28` ou similar). Vídeo pesado demais atrasa o carregamento
  da primeira dobra do site.
- **Só aparece em telas maiores** (tablet/desktop) — no celular o site
  continua mostrando a foto estática, para não consumir dados/bateria do
  visitante à toa.
