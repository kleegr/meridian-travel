  const toggleVip = () => {
    const updated = { ...itin, isVip: !itin.isVip };
    if (!itin.isVip) {
      // Turning ON — add gift checklist item if not exists
      if (!itin.checklist.some((c) => c.text.toLowerCase().includes('vip'))) {
        updated.checklist = [...itin.checklist, { id: uid(), text: 'Send VIP welcome gift', done: false }];
      }
    } else {
      // Turning OFF — remove VIP gift from checklist
      updated.checklist = itin.checklist.filter((c) => !c.text.toLowerCase().includes('vip'));
    }
    onUpdate(updated);
  };
