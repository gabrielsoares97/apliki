/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Exercise } from '../types';

/**
 * Catálogo curado de exercícios (sem vídeo — usamos descrição de execução e dica de forma em texto).
 * Cada exercício tem um grupo muscular principal, músculos secundários e o equipamento necessário,
 * para permitir busca/filtro e montagem de treinos e planos automáticos.
 */
export const EXERCISE_CATALOG: Exercise[] = [
  // Peito
  { id: 'supino-reto-barra', name: 'Supino reto com barra', muscleGroup: 'peito', secondaryMuscles: ['triceps', 'ombros'], equipment: 'barra', instructions: 'Deitado no banco, desça a barra até tocar levemente o peito e empurre para cima sem travar os cotovelos.', tip: 'Mantenha os ombros presos contra o banco durante todo o movimento.' },
  { id: 'supino-inclinado-halteres', name: 'Supino inclinado com halteres', muscleGroup: 'peito', secondaryMuscles: ['ombros', 'triceps'], equipment: 'halteres', instructions: 'Banco a 30-45°, desça os halteres ao lado do peito e empurre para cima em arco.', tip: 'Não deixe os cotovelos abrirem 90° com o tronco para proteger o ombro.' },
  { id: 'crucifixo-halteres', name: 'Crucifixo com halteres', muscleGroup: 'peito', secondaryMuscles: ['ombros'], equipment: 'halteres', instructions: 'Deitado, abra os braços em arco com leve flexão de cotovelo até sentir alongar o peito, depois feche.', tip: 'Movimento controlado, sem deixar os halteres caírem com o peso.' },
  { id: 'flexao-de-braco', name: 'Flexão de braço', muscleGroup: 'peito', secondaryMuscles: ['triceps', 'abdomen'], equipment: 'peso_corporal', instructions: 'Corpo alinhado, desça até o peito quase tocar o chão e empurre de volta.', tip: 'Mantenha o abdômen contraído para não deixar o quadril cair.' },
  { id: 'crossover-cabo', name: 'Crossover no cabo', muscleGroup: 'peito', secondaryMuscles: ['ombros'], equipment: 'cabo', instructions: 'Puxe os cabos de cima para baixo e para frente, cruzando levemente à frente do corpo.', tip: 'Incline levemente o tronco à frente para focar no peito.' },
  { id: 'supino-maquina', name: 'Supino na máquina', muscleGroup: 'peito', secondaryMuscles: ['triceps'], equipment: 'maquina', instructions: 'Ajuste o banco para os manípulos ficarem na altura do peito e empurre à frente.', tip: 'Bom exercício para iniciantes aprenderem o movimento com segurança.' },

  // Costas
  { id: 'puxada-frente-barra', name: 'Puxada na frente (pulley)', muscleGroup: 'costas', secondaryMuscles: ['biceps'], equipment: 'cabo', instructions: 'Puxe a barra até a altura do queixo/peito, levando os cotovelos para baixo e para trás.', tip: 'Evite jogar o corpo para trás para puxar mais peso.' },
  { id: 'remada-curvada-barra', name: 'Remada curvada com barra', muscleGroup: 'costas', secondaryMuscles: ['biceps', 'ombros'], equipment: 'barra', instructions: 'Tronco inclinado à frente, puxe a barra em direção ao abdômen.', tip: 'Mantenha a coluna neutra, sem arredondar as costas.' },
  { id: 'remada-unilateral-halter', name: 'Remada unilateral com halter', muscleGroup: 'costas', secondaryMuscles: ['biceps'], equipment: 'halteres', instructions: 'Apoiado no banco com um joelho e mão, puxe o halter em direção ao quadril.', tip: 'Puxe com o cotovelo, não com a mão, para ativar as costas.' },
  { id: 'barra-fixa', name: 'Barra fixa (pull-up)', muscleGroup: 'costas', secondaryMuscles: ['biceps'], equipment: 'peso_corporal', instructions: 'Pendurado na barra, puxe o corpo até o queixo passar da barra e desça controlado.', tip: 'Se não conseguir completo, use elástico de ajuda ou máquina assistida.' },
  { id: 'remada-cavalinho', name: 'Remada cavalinho (T-bar)', muscleGroup: 'costas', secondaryMuscles: ['biceps', 'ombros'], equipment: 'barra', instructions: 'Tronco flexionado, puxe a barra em direção ao peito mantendo os cotovelos próximos ao corpo.', tip: 'Evite balançar o corpo para gerar impulso.' },
  { id: 'levantamento-terra', name: 'Levantamento terra', muscleGroup: 'costas', secondaryMuscles: ['posterior', 'gluteos'], equipment: 'barra', instructions: 'Pés na largura do quadril, dobre o quadril e joelhos para pegar a barra e suba estendendo tudo junto.', tip: 'Mantenha a barra próxima ao corpo o tempo todo, coluna neutra.' },
  { id: 'puxada-alta-cabo-costas', name: 'Pulldown com corda', muscleGroup: 'costas', secondaryMuscles: ['biceps'], equipment: 'cabo', instructions: 'Puxe a corda de cima para baixo até a altura do peito, abrindo levemente no final.', tip: 'Controle a volta, não deixe o peso subir rápido demais.' },

  // Ombros
  { id: 'desenvolvimento-halteres', name: 'Desenvolvimento com halteres', muscleGroup: 'ombros', secondaryMuscles: ['triceps'], equipment: 'halteres', instructions: 'Sentado ou em pé, empurre os halteres para cima até quase estender o cotovelo.', tip: 'Não desça demais para não sobrecarregar a articulação do ombro.' },
  { id: 'elevacao-lateral', name: 'Elevação lateral', muscleGroup: 'ombros', secondaryMuscles: [], equipment: 'halteres', instructions: 'Braços ao lado do corpo, eleve os halteres até a altura dos ombros.', tip: 'Cotovelos levemente flexionados, sem usar impulso do corpo.' },
  { id: 'elevacao-frontal', name: 'Elevação frontal', muscleGroup: 'ombros', secondaryMuscles: [], equipment: 'halteres', instructions: 'Eleve o halter à frente do corpo até a altura dos ombros.', tip: 'Movimento controlado, evite balançar o tronco.' },
  { id: 'remada-alta-barra', name: 'Remada alta', muscleGroup: 'ombros', secondaryMuscles: ['costas'], equipment: 'barra', instructions: 'Puxe a barra próxima ao corpo até a altura do peito, cotovelos acima das mãos.', tip: 'Não suba além da linha dos ombros para proteger a articulação.' },
  { id: 'crucifixo-invertido', name: 'Crucifixo invertido', muscleGroup: 'ombros', secondaryMuscles: ['costas'], equipment: 'halteres', instructions: 'Tronco inclinado à frente, abra os braços elevando os halteres para os lados.', tip: 'Foque em usar o deltoide posterior, não as costas inteiras.' },
  { id: 'desenvolvimento-maquina', name: 'Desenvolvimento na máquina', muscleGroup: 'ombros', secondaryMuscles: ['triceps'], equipment: 'maquina', instructions: 'Sentado, empurre os manípulos para cima até quase estender os braços.', tip: 'Bom para treinar com segurança em cargas mais altas.' },

  // Bíceps
  { id: 'rosca-direta-barra', name: 'Rosca direta com barra', muscleGroup: 'biceps', secondaryMuscles: [], equipment: 'barra', instructions: 'Cotovelos fixos ao lado do corpo, flexione levando a barra até o peito.', tip: 'Não balance o corpo para ajudar a subir o peso.' },
  { id: 'rosca-alternada-halteres', name: 'Rosca alternada com halteres', muscleGroup: 'biceps', secondaryMuscles: [], equipment: 'halteres', instructions: 'Flexione um braço de cada vez, girando o pulso para fora ao subir.', tip: 'Desça controlado até a extensão quase completa do cotovelo.' },
  { id: 'rosca-martelo', name: 'Rosca martelo', muscleGroup: 'biceps', secondaryMuscles: ['abdomen'], equipment: 'halteres', instructions: 'Segure os halteres com pegada neutra (palmas viradas uma para a outra) e flexione.', tip: 'Ótimo também para o antebraço.' },
  { id: 'rosca-scott', name: 'Rosca Scott', muscleGroup: 'biceps', secondaryMuscles: [], equipment: 'barra', instructions: 'Braços apoiados no banco Scott, flexione a barra até quase tocar o ombro.', tip: 'O apoio evita balanço e isola melhor o bíceps.' },
  { id: 'rosca-cabo', name: 'Rosca no cabo', muscleGroup: 'biceps', secondaryMuscles: [], equipment: 'cabo', instructions: 'Puxe a barra ou corda do cabo baixo em direção ao ombro.', tip: 'Mantém tensão constante no músculo durante todo o movimento.' },

  // Tríceps
  { id: 'triceps-testa', name: 'Tríceps testa', muscleGroup: 'triceps', secondaryMuscles: [], equipment: 'barra', instructions: 'Deitado, desça a barra em direção à testa flexionando só o cotovelo.', tip: 'Mantenha os cotovelos fixos apontando para o teto.' },
  { id: 'triceps-corda-cabo', name: 'Tríceps corda no cabo', muscleGroup: 'triceps', secondaryMuscles: [], equipment: 'cabo', instructions: 'Cotovelos fixos ao lado do corpo, empurre a corda para baixo abrindo no final.', tip: 'Não deixe os cotovelos se afastarem do tronco.' },
  { id: 'triceps-frances-halter', name: 'Tríceps francês com halter', muscleGroup: 'triceps', secondaryMuscles: [], equipment: 'halteres', instructions: 'Halter atrás da cabeça, estenda o cotovelo para cima.', tip: 'Mantenha o cotovelo apontando para frente, não para os lados.' },
  { id: 'mergulho-banco', name: 'Mergulho no banco (dips)', muscleGroup: 'triceps', secondaryMuscles: ['peito', 'ombros'], equipment: 'peso_corporal', instructions: 'Mãos apoiadas no banco atrás do corpo, desça flexionando os cotovelos e suba.', tip: 'Não desça demais para não sobrecarregar o ombro.' },
  { id: 'triceps-coice-halter', name: 'Tríceps coice com halter', muscleGroup: 'triceps', secondaryMuscles: [], equipment: 'halteres', instructions: 'Tronco inclinado, braço paralelo ao corpo, estenda o cotovelo para trás.', tip: 'Mantenha o braço fixo, só o antebraço se move.' },

  // Quadríceps
  { id: 'agachamento-livre', name: 'Agachamento livre', muscleGroup: 'quadriceps', secondaryMuscles: ['gluteos', 'posterior'], equipment: 'barra', instructions: 'Barra nas costas, desça flexionando quadril e joelhos até coxas paralelas ao chão, suba.', tip: 'Joelhos alinhados com a ponta dos pés, sem colapsar para dentro.' },
  { id: 'leg-press', name: 'Leg press', muscleGroup: 'quadriceps', secondaryMuscles: ['gluteos'], equipment: 'maquina', instructions: 'Empurre a plataforma estendendo as pernas sem travar os joelhos.', tip: 'Não deixe a lombar descolar do encosto.' },
  { id: 'cadeira-extensora', name: 'Cadeira extensora', muscleGroup: 'quadriceps', secondaryMuscles: [], equipment: 'maquina', instructions: 'Estenda os joelhos elevando o peso até quase travar.', tip: 'Movimento controlado, sem jogar o peso com impulso.' },
  { id: 'afundo-halteres', name: 'Afundo com halteres', muscleGroup: 'quadriceps', secondaryMuscles: ['gluteos'], equipment: 'halteres', instructions: 'Dê um passo à frente e desça até o joelho de trás quase tocar o chão.', tip: 'Mantenha o tronco ereto durante o movimento.' },
  { id: 'agachamento-bulgaro', name: 'Agachamento búlgaro', muscleGroup: 'quadriceps', secondaryMuscles: ['gluteos'], equipment: 'halteres', instructions: 'Pé de trás apoiado em um banco, desça agachando com a perna da frente.', tip: 'Ótimo para corrigir desequilíbrios entre as pernas.' },
  { id: 'agachamento-peso-corporal', name: 'Agachamento livre (peso corporal)', muscleGroup: 'quadriceps', secondaryMuscles: ['gluteos'], equipment: 'peso_corporal', instructions: 'Pés na largura dos ombros, desça o quadril como se fosse sentar e suba.', tip: 'Ótimo para aquecer ou treinar em casa sem equipamento.' },

  // Posterior de coxa
  { id: 'stiff-barra', name: 'Stiff com barra', muscleGroup: 'posterior', secondaryMuscles: ['gluteos', 'costas'], equipment: 'barra', instructions: 'Pernas quase estendidas, desça a barra deslizando pelas coxas até sentir alongar o posterior.', tip: 'Mantenha a coluna neutra, não arredonde as costas.' },
  { id: 'mesa-flexora', name: 'Mesa flexora', muscleGroup: 'posterior', secondaryMuscles: [], equipment: 'maquina', instructions: 'Deitado de bruços, flexione os joelhos trazendo o peso em direção aos glúteos.', tip: 'Evite elevar o quadril da mesa durante o movimento.' },
  { id: 'stiff-halteres', name: 'Stiff com halteres', muscleGroup: 'posterior', secondaryMuscles: ['gluteos'], equipment: 'halteres', instructions: 'Mesma execução do stiff, usando halteres ao invés da barra.', tip: 'Boa opção para quem treina em casa.' },
  { id: 'elevacao-pelvica', name: 'Elevação pélvica (hip thrust)', muscleGroup: 'gluteos', secondaryMuscles: ['posterior'], equipment: 'barra', instructions: 'Costas apoiadas no banco, empurre o quadril para cima contraindo os glúteos no topo.', tip: 'Queixo neutro, não hiperestenda a lombar no topo.' },

  // Glúteos
  { id: 'coice-cabo', name: 'Coice no cabo (glúteo)', muscleGroup: 'gluteos', secondaryMuscles: ['posterior'], equipment: 'cabo', instructions: 'Empurre a perna para trás contraindo o glúteo, sem usar impulso da lombar.', tip: 'Movimento curto e controlado, foco na contração.' },
  { id: 'abducao-maquina', name: 'Cadeira abdutora', muscleGroup: 'gluteos', secondaryMuscles: [], equipment: 'maquina', instructions: 'Sentado, abra as pernas contra a resistência da máquina.', tip: 'Não use impulso do tronco para abrir mais.' },
  { id: 'elevacao-pelvica-peso-corporal', name: 'Ponte de glúteo', muscleGroup: 'gluteos', secondaryMuscles: ['posterior'], equipment: 'peso_corporal', instructions: 'Deitado, eleve o quadril contraindo os glúteos no topo.', tip: 'Bom exercício de ativação antes de treinos de perna.' },

  // Panturrilha
  { id: 'panturrilha-em-pe', name: 'Panturrilha em pé', muscleGroup: 'panturrilha', secondaryMuscles: [], equipment: 'maquina', instructions: 'Suba na ponta dos pés o máximo possível e desça controlado.', tip: 'Faça o movimento completo, sem cortar a amplitude.' },
  { id: 'panturrilha-sentado', name: 'Panturrilha sentado', muscleGroup: 'panturrilha', secondaryMuscles: [], equipment: 'maquina', instructions: 'Sentado, empurre o peso para cima usando só os tornozelos.', tip: 'Foca mais no sóleo (parte de baixo da panturrilha).' },
  { id: 'panturrilha-peso-corporal', name: 'Panturrilha peso do corpo', muscleGroup: 'panturrilha', secondaryMuscles: [], equipment: 'peso_corporal', instructions: 'Em pé, suba na ponta dos pés repetidamente, pode usar uma parede de apoio.', tip: 'Faça devagar para sentir bem a contração.' },

  // Abdômen
  { id: 'abdominal-supra', name: 'Abdominal supra', muscleGroup: 'abdomen', secondaryMuscles: [], equipment: 'peso_corporal', instructions: 'Deitado, flexione o tronco em direção aos joelhos contraindo o abdômen.', tip: 'Não puxe o pescoço com as mãos.' },
  { id: 'prancha', name: 'Prancha isométrica', muscleGroup: 'abdomen', secondaryMuscles: [], equipment: 'peso_corporal', instructions: 'Apoiado nos antebraços e pontas dos pés, mantenha o corpo reto e contraído pelo tempo definido.', tip: 'Não deixe o quadril subir ou cair.' },
  { id: 'elevacao-pernas', name: 'Elevação de pernas', muscleGroup: 'abdomen', secondaryMuscles: [], equipment: 'peso_corporal', instructions: 'Deitado, eleve as pernas estendidas até 90° e desça controlado sem tocar o chão.', tip: 'Mantenha a lombar sempre em contato com o chão.' },
  { id: 'abdominal-obliquo', name: 'Abdominal oblíquo', muscleGroup: 'abdomen', secondaryMuscles: [], equipment: 'peso_corporal', instructions: 'Deitado, leve o cotovelo em direção ao joelho oposto alternando os lados.', tip: 'Movimento rotacional controlado, sem puxar o pescoço.' },
  { id: 'roda-abdominal', name: 'Roda abdominal (ab wheel)', muscleGroup: 'abdomen', secondaryMuscles: ['ombros'], equipment: 'peso_corporal', instructions: 'Ajoelhado, role a roda à frente mantendo o abdômen contraído e volte.', tip: 'Comece com amplitude pequena até ganhar força no core.' },

  // Cardio
  { id: 'esteira-caminhada', name: 'Caminhada/corrida na esteira', muscleGroup: 'cardio', secondaryMuscles: ['quadriceps', 'panturrilha'], equipment: 'maquina', instructions: 'Ajuste velocidade e inclinação conforme o objetivo (queima de gordura ou condicionamento).', tip: 'Mantenha postura ereta, sem se apoiar demais no corrimão.' },
  { id: 'bicicleta-ergometrica', name: 'Bicicleta ergométrica', muscleGroup: 'cardio', secondaryMuscles: ['quadriceps'], equipment: 'maquina', instructions: 'Pedale em ritmo constante ou em intervalos (HIIT) conforme o treino.', tip: 'Ajuste o banco para o joelho ficar levemente flexionado no pedal mais baixo.' },
  { id: 'pular-corda', name: 'Pular corda', muscleGroup: 'cardio', secondaryMuscles: ['panturrilha'], equipment: 'nenhum', instructions: 'Salte de forma leve e constante, girando a corda com o pulso.', tip: 'Aterrisse na ponta dos pés para proteger os joelhos.' },
  { id: 'burpee', name: 'Burpee', muscleGroup: 'cardio', secondaryMuscles: ['peito', 'quadriceps', 'abdomen'], equipment: 'peso_corporal', instructions: 'Agache, jogue as pernas para trás em prancha, faça uma flexão, volte e salte.', tip: 'Ritmo constante, ajuste a intensidade conforme o condicionamento.' },
  { id: 'polichinelo', name: 'Polichinelo', muscleGroup: 'cardio', secondaryMuscles: ['ombros'], equipment: 'nenhum', instructions: 'Salte abrindo pernas e braços simultaneamente, depois volte à posição inicial.', tip: 'Bom para aquecimento ou treino intervalado.' },
  { id: 'escalador', name: 'Escalador (mountain climber)', muscleGroup: 'cardio', secondaryMuscles: ['abdomen'], equipment: 'peso_corporal', instructions: 'Em posição de prancha, alterne trazendo os joelhos em direção ao peito rapidamente.', tip: 'Mantenha o quadril baixo e estável.' },

  // Corpo todo / funcional
  { id: 'kettlebell-swing', name: 'Kettlebell swing', muscleGroup: 'corpo_todo', secondaryMuscles: ['gluteos', 'posterior', 'ombros'], equipment: 'kettlebell', instructions: 'Balance o kettlebell entre as pernas e projete o quadril à frente para impulsionar até a altura do peito.', tip: 'O movimento vem do quadril, não dos braços.' },
  { id: 'thruster-halteres', name: 'Thruster com halteres', muscleGroup: 'corpo_todo', secondaryMuscles: ['quadriceps', 'ombros'], equipment: 'halteres', instructions: 'Agache com os halteres nos ombros e, ao subir, empurre-os acima da cabeça.', tip: 'Movimento explosivo controlado, ótimo para condicionamento.' },
  { id: 'clean-and-press-halteres', name: 'Clean and press com halteres', muscleGroup: 'corpo_todo', secondaryMuscles: ['costas', 'ombros'], equipment: 'halteres', instructions: 'Puxe os halteres do chão até os ombros e depois empurre acima da cabeça.', tip: 'Aprenda o movimento com carga leve antes de progredir.' },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_CATALOG.find((e) => e.id === id);
}

export function searchExercises(query: string, muscleGroup?: string | null, equipment?: string | null): Exercise[] {
  const q = query.trim().toLowerCase();
  return EXERCISE_CATALOG.filter((e) => {
    if (muscleGroup && e.muscleGroup !== muscleGroup) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (q && !e.name.toLowerCase().includes(q)) return false;
    return true;
  });
}
