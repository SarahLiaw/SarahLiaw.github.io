---
layout: post
title:  "Learning When Not to Learn: Risk-Sensitive Abstention in Bandits with Unbounded Rewards"
date:   2026-01-15 00:00:00 +00:00
image: images/learning-when-not-learn.png
categories: research
authors: "<strong>Sarah Liaw*</strong>, Benjamin Plaut*"
bibtex: |
  @misc{liaw2025learninglearnrisksensitiveabstention,
      title={Learning When Not to Learn: Risk-Sensitive Abstention in Bandits with Unbounded Rewards}, 
      author={Sarah Liaw and Benjamin Plaut},
      year={2025},
      eprint={2510.14884},
      archivePrefix={arXiv},
      primaryClass={cs.LG},
      url={https://arxiv.org/abs/2510.14884}, 
  }
venue: "AISTATS"
tldr: "Cautious contextual bandit algorithm with abstain option for high-stakes environments with unbounded negative rewards."
arxiv: https://arxiv.org/abs/2510.14884
---

In high-stakes AI applications, even a single action can cause irreparable damage. However, nearly all of sequential decision-making theory assumes that all errors are recoverable (e.g., by bounding rewards). Standard bandit algorithms that explore aggressively may cause irreparable damage when this assumption fails. Some prior work avoids irreparable errors by asking for help from a mentor, but a mentor may not always be available. In this work, we formalize a model of learning with unbounded rewards without a mentor as a two-action contextual bandit with an abstain option: at each round the agent observes an input and chooses either to abstain (always 0 reward) or to commit (execute a preexisting task policy). Committing yields rewards that are upper-bounded but can be arbitrarily negative, and the commit reward is assumed Lipschitz in the input. We propose a caution-based algorithm that learns when not to learn: it chooses a trusted region and commits only where the available evidence does not already certify harm. Under these conditions and i.i.d. inputs, we establish sublinear regret guarantees, theoretically demonstrating the effectiveness of cautious exploration for deploying learning agents safely in high-stakes environments.
