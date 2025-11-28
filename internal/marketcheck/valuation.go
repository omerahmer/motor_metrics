package marketcheck

func ComputeValuation(history []PricePoint, currentPrice int) Valuation {
	if len(history) == 0 {
		return Valuation{IsGoodValue: false, Score: 0}
	}

	sum := 0
	for _, p := range history {
		sum += p.Price
	}

	avg := float64(sum) / float64(len(history))
	score := (avg - float64(currentPrice)) / avg

	return Valuation{
		IsGoodValue: score > 0.05,
		Score:       score,
	}
}
