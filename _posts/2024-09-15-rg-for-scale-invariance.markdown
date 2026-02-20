---
layout: post
title:  "A Renormalization Group Framework for Scale Invariant Feature Learning in Deep Neural Networks"
date:   2025-04-11 00:00:00 +00:00
image: images/nn.png
categories: research
authors: "<strong>Sarah Liaw</strong>"
bibtex: |
  @inproceedings{Liaw_2025,
    title={A Renormalization Group Framework for Scale-Invariant Feature Learning in Deep Neural Networks (Student Abstract)},
    author={Liaw, Sarah},
    booktitle={Proceedings of the AAAI Conference on Artificial Intelligence},
    volume={39},
    number={28},
    pages={29410-29411},
    year={2025},
    url={https://doi.org/10.1609/aaai.v39i28.35269}
  }
venue: "AAAI'25 (Student Abstract)"
tldr: "Renormalization group theory to analyze and optimize scale-invariant feature learning in NNs."
paper: https://ojs.aaai.org/index.php/AAAI/article/view/35269
---

We propose a framework that uses renormalization group (RG) theory from statistical physics to analyze and optimize the hierarchical feature learning process in deep neural networks. Here, the layer-wise transformations in deep networks can be viewed as analogous to RG transformations, with each layer implementing a coarse-graining operation that extracts increasingly abstract features. We propose an approach to enforce scale invariance in neural networks, introduce scale-aware activation functions, and derive RG flow equations for network parameters. We show that our approach leads to fixed points corresponding to scale-invariant feature representations. Finally, we propose an RG-guided training procedure that converges to these fixed points while minimizing the loss function.