const categoryLabels = {
    mental_demand: 'Mental Demand',
    time_pressure: 'Time Pressure',
    task_difficulty: 'Task Difficulty',
    stress_level: 'Stress Level',
    fatigue: 'Fatigue',
};
function getWorkloadBand(averageScore) {
    if (averageScore <= 2.2) {
        return 'low_workload';
    }
    if (averageScore <= 3.6) {
        return 'moderate_workload';
    }
    return 'high_workload';
}
export function scoreWorkloadAssessment({ participantId, definition, answers }) {
    const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
    const categoryScores = {};
    let totalScore = 0;
    let answeredQuestions = 0;
    for (const question of definition.questions) {
        const answer = answerMap.get(question.id);
        const selectedOption = question.options.find((option) => option.id === answer?.selectedOptionId);
        const answerValue = answer?.value ?? selectedOption?.value ?? 0;
        if (answerValue > 0) {
            answeredQuestions += 1;
            totalScore += answerValue;
            categoryScores[question.dimensionKey ?? 'other'] =
                (categoryScores[question.dimensionKey ?? 'other'] ?? 0) + answerValue;
        }
    }
    const averageScore = answeredQuestions === 0 ? 0 : Number((totalScore / answeredQuestions).toFixed(2));
    const scoreBand = getWorkloadBand(averageScore);
    return {
        scoreTotal: totalScore,
        scoreBand,
        primaryType: null,
        secondaryType: null,
        profileCode: null,
        interpretationKey: scoreBand,
        payload: {
            participantId,
            totalScore,
            averageScore,
            answeredQuestions,
            categoryScores,
            scoreBand,
            note: 'Dummy workload scoring for MVP use. Interpret operationally, not clinically.',
        },
        summaries: [
            ...Object.entries(categoryScores).map(([key, score]) => ({
                metricKey: key,
                metricLabel: categoryLabels[key] ?? key,
                score,
                band: null,
            })),
            {
                metricKey: 'overall_average',
                metricLabel: 'Overall Average',
                score: averageScore,
                band: scoreBand,
            },
        ],
    };
}
