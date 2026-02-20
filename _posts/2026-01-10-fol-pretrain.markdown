---
layout: post
title:  "FOL-Pretrain: A complexity annotated corpus of first-order logic"
date:   2026-01-10 00:00:00 +00:00
image: images/fol-pretrain.png
categories: research
authors: "Isabelle Lee, <strong>Sarah Liaw</strong>, Dani Yogatama"
bibtex: |
  @misc{lee2026foltracesverifiedfirstorderlogic,
      title={FOL-Traces: Verified First-Order Logic Reasoning Traces at Scale}, 
      author={Isabelle Lee and Sarah Liaw and Dani Yogatama},
      year={2026},
      eprint={2505.14932},
      archivePrefix={arXiv},
      primaryClass={cs.AI},
      url={https://arxiv.org/abs/2505.14932}, 
  }
venue: "EACL"
tldr: "Large-scale, complexity-annotated dataset of FOL reasoning traces for algorithmic reasoning in LLMs."
arxiv: https://arxiv.org/abs/2505.14932
code: https://github.com/iglee/fol-traces
huggingface: https://huggingface.co/datasets/fol-traces/fol-traces
---

Transformer-based large language models (LLMs) have demonstrated remarkable reasoning capabilities such as coding and solving mathematical problems to commonsense inference. While these tasks vary in complexity, they all require models to integrate and compute over structured information. Despite recent efforts to reverse-engineer LLM behavior through controlled experiments, our understanding of how these models internalize and execute complex algorithms remains limited. Progress has largely been confined to small-scale studies or shallow tasks such as basic arithmetic and grammatical pattern matching. One barrier to deeper understanding is the nature of pretraining data -- vast, heterogeneous, and often poorly annotated, making it difficult to isolate mechanisms of reasoning. To bridge this gap, we introduce a large-scale, fully open, complexity-annotated dataset of first-order logic reasoning traces, designed to probe and analyze algorithmic reasoning in LLMs. The dataset consists of 3.5 billion tokens, including 8.8 million LLM-augmented, human-annotated examples and 7.5 million synthetically generated examples. Each synthetic example is verifiably correct, produced by a custom automated theorem solver, and accompanied by metadata tracing its algorithmic provenance. We aim to provide a scalable, interpretable artifact for studying how LLMs learn and generalize symbolic reasoning processes, paving the way for more transparent and targeted investigations into the algorithmic capabilities of modern models.
