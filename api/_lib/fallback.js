import { resolveLanguage } from "./language.js";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "i",
  "in", "is", "it", "me", "my", "of", "on", "or", "safely", "the", "this",
  "to", "with", "el", "la", "los", "las", "de", "del", "y", "para", "por",
  "un", "una", "o", "en", "con", "do", "da", "dos", "das", "e", "um",
  "uma", "no", "na", "nos", "nas", "com", "для", "и", "в", "на", "с",
]);

const SENSITIVE_TERMS = [
  "password", "passcode", "one-time code", "one time code", "verification code",
  "private key", "secret", "seed phrase", "card number", "credit card", "cvv",
  "security code", "密码", "口令", "验证码", "一次性代码", "私钥", "密钥", "助记词",
  "卡号", "信用卡", "安全码", "비밀번호", "암호", "인증 코드", "일회용 코드", "개인 키",
  "비밀 키", "복구 문구", "카드 번호", "신용카드", "보안 코드", "パスワード", "暗証番号",
  "認証コード", "ワンタイムコード", "秘密鍵", "シークレット", "シードフレーズ", "カード番号",
  "クレジットカード", "セキュリティコード", "contraseña", "código de verificación",
  "código de un solo uso", "clave privada", "secreto", "frase semilla", "número de tarjeta",
  "tarjeta de crédito", "código de seguridad", "пароль", "код подтверждения", "одноразовый код",
  "закрытый ключ", "секрет", "сид-фраза", "номер карты", "кредитная карта", "код безопасности",
  "senha", "código de verificação", "código de uso único", "chave privada", "segredo",
  "frase-semente", "número do cartão", "cartão de crédito", "código de segurança",
];

const COMMIT_TERMS = [
  "save", "apply", "confirm", "continue", "submit", "publish", "update", "create",
  "add", "invite", "send", "enable", "checkout", "pay", "delete", "remove", "revoke",
  "保存", "应用", "套用", "确认", "继续", "提交", "发布", "更新", "创建", "添加", "邀请",
  "发送", "启用", "结账", "付款", "支付", "删除", "移除", "撤销", "저장", "적용", "확인",
  "계속", "제출", "게시", "업데이트", "만들기", "추가", "초대", "보내기", "활성화", "결제",
  "지불", "삭제", "제거", "취소", "保存", "適用", "確認", "続行", "送信", "公開", "更新",
  "作成", "追加", "招待", "有効", "購入", "支払", "削除", "取り消", "guardar", "aplicar",
  "confirmar", "continuar", "enviar", "publicar", "actualizar", "crear", "añadir", "agregar",
  "invitar", "habilitar", "pagar", "eliminar", "quitar", "revocar", "сохранить", "применить",
  "подтвердить", "продолжить", "отправить", "опубликовать", "обновить", "создать", "добавить",
  "пригласить", "включить", "оплатить", "удалить", "отозвать", "salvar", "aplicar", "confirmar",
  "continuar", "enviar", "publicar", "atualizar", "criar", "adicionar", "convidar", "ativar",
  "pagar", "excluir", "remover", "revogar",
];

const SAFE_COMMIT_TERMS = [
  "save", "apply", "confirm", "continue", "submit", "update", "保存", "应用", "套用", "确认",
  "继续", "提交", "更新", "저장", "적용", "확인", "계속", "제출", "업데이트", "保存", "適用",
  "確認", "続行", "送信", "更新", "guardar", "aplicar", "confirmar", "continuar", "enviar",
  "actualizar", "сохранить", "применить", "подтвердить", "продолжить", "отправить", "обновить",
  "salvar", "aplicar", "confirmar", "continuar", "enviar", "atualizar",
];

const HIGH_RISK_TERMS = [
  "publish", "send", "invite", "checkout", "pay", "purchase", "delete", "remove", "revoke",
  "transfer", "close account", "发布", "发送", "邀请", "结账", "付款", "支付", "购买", "删除",
  "移除", "撤销", "转账", "关闭账户", "게시", "보내기", "초대", "결제", "지불", "구매", "삭제",
  "제거", "취소", "이체", "계정 폐쇄", "公開", "送信", "招待", "購入", "支払", "削除", "取消",
  "送金", "アカウントを閉鎖", "publicar", "enviar", "invitar", "pagar", "comprar", "eliminar",
  "quitar", "revocar", "transferir", "cerrar cuenta", "опубликовать", "отправить", "пригласить",
  "оплатить", "купить", "удалить", "отозвать", "перевести", "закрыть аккаунт", "publicar",
  "enviar", "convidar", "pagar", "comprar", "excluir", "remover", "revogar", "transferir",
  "encerrar conta",
];

const COPY = {
  "en-US": {
    summary: (goal) => `Basic guide created for your goal: ${goal}`,
    input: (label) => ({
      title: `Update ${label}`,
      instruction: `Find the "${label}" field and enter the value required by your goal. Do not enter passwords, security codes, or other secrets.`,
      verification: `Confirm the "${label}" field shows the intended value.`,
    }),
    select: (label) => ({
      title: `Choose ${label}`,
      instruction: `Open "${label}" and choose the option that matches your goal.`,
      verification: `Confirm "${label}" shows the option you intended.`,
    }),
    navigate: (label) => ({
      title: `Open ${label}`,
      instruction: `Select "${label}" to open the relevant area, then review what appears before continuing.`,
      verification: `Confirm the page now shows the section associated with "${label}".`,
    }),
    use: (label) => ({
      title: `Use ${label}`,
      instruction: `Select "${label}", then review the resulting page state before moving on.`,
      verification: `Confirm selecting "${label}" produced the expected visible result.`,
    }),
    review: {
      title: "Review the current page",
      instruction: "Confirm you are on the correct page and compare the visible settings with your goal before changing anything.",
      verification: "The page and account context match the task you intend to complete.",
      caution: "Stop if the page, account, or requested outcome is not what you expected.",
    },
    commit: (label) => ({
      title: `Confirm with ${label}`,
      instruction: `Review your changes, then select "${label}" when you are ready to finish.`,
      verification: "Confirm the page shows the expected result and no error message.",
      caution: "Review the final values before continuing.",
    }),
    riskyCommit: (label) => ({
      title: "Review before confirming",
      instruction: `Review every value and consequence, then select "${label}" only when you are certain.`,
      verification: "Confirm the page shows the expected result and no error message.",
      caution: "This action may affect other people, money, access, or published data. Review it carefully.",
    }),
    verify: {
      title: "Verify the result",
      instruction: "Check the page for the updated value, a confirmation message, or another visible sign that your goal was completed.",
      verification: "The intended result is visible and the page shows no unresolved error.",
      caution: "Do not assume the change succeeded without visible confirmation.",
    },
  },
  "zh-CN": {
    summary: (goal) => `已根据你的目标创建基础指南：${goal}`,
    input: (label) => ({
      title: `更新${label}`,
      instruction: `找到“${label}”字段，并输入实现目标所需的内容。不要输入密码、验证码或其他机密信息。`,
      verification: `确认“${label}”字段显示的是你想要的内容。`,
    }),
    select: (label) => ({
      title: `选择${label}`,
      instruction: `打开“${label}”，并选择符合你目标的选项。`,
      verification: `确认“${label}”显示的是你选择的选项。`,
    }),
    navigate: (label) => ({
      title: `打开${label}`,
      instruction: `选择“${label}”以打开相关区域，然后在继续前查看出现的内容。`,
      verification: `确认页面现在显示与“${label}”相关的区域。`,
    }),
    use: (label) => ({
      title: `使用${label}`,
      instruction: `选择“${label}”，然后在继续前检查页面上的变化。`,
      verification: `确认选择“${label}”后出现了预期的可见结果。`,
    }),
    review: {
      title: "检查当前页面",
      instruction: "确认你位于正确的页面，并在更改任何内容前将可见设置与你的目标进行比较。",
      verification: "页面和账户信息与需要完成的任务一致。",
      caution: "如果页面、账户或目标与预期不符，请停止操作。",
    },
    commit: (label) => ({
      title: `使用${label}确认`,
      instruction: `检查你的更改，准备完成时再选择“${label}”。`,
      verification: "确认页面显示预期结果，并且没有错误消息。",
      caution: "继续前请检查最终内容。",
    }),
    riskyCommit: (label) => ({
      title: "确认前仔细检查",
      instruction: `检查所有内容和可能的后果，只有在确定无误时才选择“${label}”。`,
      verification: "确认页面显示预期结果，并且没有错误消息。",
      caution: "此操作可能影响他人、资金、访问权限或已发布的数据，请仔细检查。",
    }),
    verify: {
      title: "验证结果",
      instruction: "检查页面上是否出现更新后的内容、确认消息或其他表明目标已完成的可见迹象。",
      verification: "预期结果清晰可见，页面没有未解决的错误。",
      caution: "没有可见确认时，不要假定更改已经成功。",
    },
  },
  "ko-KR": {
    summary: (goal) => `다음 목표에 맞는 기본 안내를 만들었습니다: ${goal}`,
    input: (label) => ({
      title: `${label} 업데이트`,
      instruction: `"${label}" 필드를 찾아 목표에 필요한 값을 입력하세요. 비밀번호, 인증 코드 또는 기타 비밀 정보는 입력하지 마세요.`,
      verification: `"${label}" 필드에 의도한 값이 표시되는지 확인하세요.`,
    }),
    select: (label) => ({
      title: `${label} 선택`,
      instruction: `"${label}"을 열고 목표에 맞는 옵션을 선택하세요.`,
      verification: `"${label}"에 의도한 옵션이 표시되는지 확인하세요.`,
    }),
    navigate: (label) => ({
      title: `${label} 열기`,
      instruction: `"${label}"을 선택해 관련 영역을 연 다음, 계속하기 전에 표시된 내용을 확인하세요.`,
      verification: `페이지에 "${label}"과 관련된 영역이 표시되는지 확인하세요.`,
    }),
    use: (label) => ({
      title: `${label} 사용`,
      instruction: `"${label}"을 선택한 다음, 계속하기 전에 페이지의 변화를 확인하세요.`,
      verification: `"${label}"을 선택한 뒤 예상한 결과가 화면에 표시되는지 확인하세요.`,
    }),
    review: {
      title: "현재 페이지 확인",
      instruction: "올바른 페이지인지 확인하고, 변경하기 전에 화면의 설정을 목표와 비교하세요.",
      verification: "페이지와 계정 정보가 완료하려는 작업과 일치합니다.",
      caution: "페이지, 계정 또는 요청한 결과가 예상과 다르면 중지하세요.",
    },
    commit: (label) => ({
      title: `${label}(으)로 확인`,
      instruction: `변경 내용을 검토한 뒤 완료할 준비가 되면 "${label}"을 선택하세요.`,
      verification: "페이지에 예상한 결과가 표시되고 오류 메시지가 없는지 확인하세요.",
      caution: "계속하기 전에 최종 값을 다시 확인하세요.",
    }),
    riskyCommit: (label) => ({
      title: "확정 전 검토",
      instruction: `모든 값과 영향을 검토하고 확실한 경우에만 "${label}"을 선택하세요.`,
      verification: "페이지에 예상한 결과가 표시되고 오류 메시지가 없는지 확인하세요.",
      caution: "이 작업은 다른 사람, 금전, 접근 권한 또는 게시된 데이터에 영향을 줄 수 있으므로 신중히 검토하세요.",
    }),
    verify: {
      title: "결과 확인",
      instruction: "업데이트된 값, 확인 메시지 또는 목표 완료를 보여 주는 다른 표시가 페이지에 있는지 확인하세요.",
      verification: "의도한 결과가 화면에 보이고 해결되지 않은 오류가 없습니다.",
      caution: "화면에서 확인하기 전에는 변경이 성공했다고 가정하지 마세요.",
    },
  },
  "ja-JP": {
    summary: (goal) => `次の目標に合わせて基本ガイドを作成しました：${goal}`,
    input: (label) => ({
      title: `${label}を更新`,
      instruction: `「${label}」欄を見つけ、目標に必要な値を入力してください。パスワード、認証コード、その他の秘密情報は入力しないでください。`,
      verification: `「${label}」欄に意図した値が表示されていることを確認してください。`,
    }),
    select: (label) => ({
      title: `${label}を選択`,
      instruction: `「${label}」を開き、目標に合う選択肢を選んでください。`,
      verification: `「${label}」に意図した選択肢が表示されていることを確認してください。`,
    }),
    navigate: (label) => ({
      title: `${label}を開く`,
      instruction: `「${label}」を選んで関連する場所を開き、続ける前に表示内容を確認してください。`,
      verification: `「${label}」に関連する項目がページに表示されていることを確認してください。`,
    }),
    use: (label) => ({
      title: `${label}を使う`,
      instruction: `「${label}」を選び、次へ進む前にページの変化を確認してください。`,
      verification: `「${label}」を選んだ後、期待した結果が画面に表示されていることを確認してください。`,
    }),
    review: {
      title: "現在のページを確認",
      instruction: "正しいページにいることを確認し、変更する前に画面上の設定を目標と照らし合わせてください。",
      verification: "ページとアカウントの情報が、完了したい作業と一致しています。",
      caution: "ページ、アカウント、または目的が予想と異なる場合は操作を止めてください。",
    },
    commit: (label) => ({
      title: `${label}で確定`,
      instruction: `変更内容を確認し、完了する準備ができたら「${label}」を選んでください。`,
      verification: "ページに期待した結果が表示され、エラーメッセージがないことを確認してください。",
      caution: "続ける前に最終的な内容を確認してください。",
    }),
    riskyCommit: (label) => ({
      title: "確定前に確認",
      instruction: `すべての値と影響を確認し、確信できる場合にのみ「${label}」を選んでください。`,
      verification: "ページに期待した結果が表示され、エラーメッセージがないことを確認してください。",
      caution: "この操作は他の人、お金、アクセス権、公開データに影響する可能性があります。慎重に確認してください。",
    }),
    verify: {
      title: "結果を確認",
      instruction: "更新された値、確認メッセージ、または目標の完了を示す表示がページにあるか確認してください。",
      verification: "意図した結果が画面に表示され、未解決のエラーがありません。",
      caution: "画面で確認できるまでは、変更が成功したと判断しないでください。",
    },
  },
  "es-ES": {
    summary: (goal) => `Guía básica creada para tu objetivo: ${goal}`,
    input: (label) => ({
      title: `Actualizar ${label}`,
      instruction: `Busca el campo «${label}» e introduce el valor necesario para tu objetivo. No introduzcas contraseñas, códigos de seguridad ni otros datos secretos.`,
      verification: `Comprueba que el campo «${label}» muestra el valor que querías.`,
    }),
    select: (label) => ({
      title: `Elegir ${label}`,
      instruction: `Abre «${label}» y elige la opción que corresponda a tu objetivo.`,
      verification: `Comprueba que «${label}» muestra la opción que querías.`,
    }),
    navigate: (label) => ({
      title: `Abrir ${label}`,
      instruction: `Selecciona «${label}» para abrir la sección correspondiente y revisa lo que aparece antes de continuar.`,
      verification: `Comprueba que la página muestra la sección asociada a «${label}».`,
    }),
    use: (label) => ({
      title: `Usar ${label}`,
      instruction: `Selecciona «${label}» y revisa el cambio visible en la página antes de seguir.`,
      verification: `Comprueba que seleccionar «${label}» produjo el resultado visible esperado.`,
    }),
    review: {
      title: "Revisar la página actual",
      instruction: "Comprueba que estás en la página correcta y compara las opciones visibles con tu objetivo antes de cambiar nada.",
      verification: "La página y la cuenta corresponden a la tarea que quieres completar.",
      caution: "Detente si la página, la cuenta o el resultado solicitado no son los que esperabas.",
    },
    commit: (label) => ({
      title: `Confirmar con ${label}`,
      instruction: `Revisa los cambios y selecciona «${label}» cuando estés listo para terminar.`,
      verification: "Comprueba que la página muestra el resultado esperado y ningún mensaje de error.",
      caution: "Revisa los valores finales antes de continuar.",
    }),
    riskyCommit: (label) => ({
      title: "Revisar antes de confirmar",
      instruction: `Revisa todos los valores y consecuencias. Selecciona «${label}» solo cuando estés seguro.`,
      verification: "Comprueba que la página muestra el resultado esperado y ningún mensaje de error.",
      caution: "Esta acción puede afectar a otras personas, dinero, permisos o datos publicados. Revísala con atención.",
    }),
    verify: {
      title: "Comprobar el resultado",
      instruction: "Busca en la página el valor actualizado, un mensaje de confirmación u otra señal visible de que se completó tu objetivo.",
      verification: "El resultado previsto es visible y la página no muestra errores pendientes.",
      caution: "No des por hecho que el cambio funcionó sin una confirmación visible.",
    },
  },
  "ru-RU": {
    summary: (goal) => `Базовое руководство для вашей цели: ${goal}`,
    input: (label) => ({
      title: `Обновить: ${label}`,
      instruction: `Найдите поле «${label}» и введите значение, необходимое для вашей цели. Не вводите пароли, коды подтверждения и другие секретные данные.`,
      verification: `Убедитесь, что в поле «${label}» указано нужное значение.`,
    }),
    select: (label) => ({
      title: `Выбрать: ${label}`,
      instruction: `Откройте «${label}» и выберите вариант, соответствующий вашей цели.`,
      verification: `Убедитесь, что в «${label}» отображается нужный вариант.`,
    }),
    navigate: (label) => ({
      title: `Открыть: ${label}`,
      instruction: `Выберите «${label}», чтобы открыть нужный раздел, затем проверьте содержимое перед продолжением.`,
      verification: `Убедитесь, что на странице появился раздел, связанный с «${label}».`,
    }),
    use: (label) => ({
      title: `Использовать: ${label}`,
      instruction: `Выберите «${label}», затем проверьте видимые изменения на странице перед продолжением.`,
      verification: `Убедитесь, что после выбора «${label}» появился ожидаемый результат.`,
    }),
    review: {
      title: "Проверить текущую страницу",
      instruction: "Убедитесь, что открыта нужная страница, и сравните видимые настройки со своей целью, прежде чем что-либо менять.",
      verification: "Страница и учётная запись соответствуют задаче, которую вы хотите выполнить.",
      caution: "Остановитесь, если страница, учётная запись или желаемый результат отличаются от ожидаемых.",
    },
    commit: (label) => ({
      title: `Подтвердить через «${label}»`,
      instruction: `Проверьте изменения и выберите «${label}», когда будете готовы завершить задачу.`,
      verification: "Убедитесь, что страница показывает ожидаемый результат и не содержит сообщения об ошибке.",
      caution: "Проверьте итоговые значения перед продолжением.",
    }),
    riskyCommit: (label) => ({
      title: "Проверить перед подтверждением",
      instruction: `Проверьте все значения и последствия. Выбирайте «${label}» только при полной уверенности.`,
      verification: "Убедитесь, что страница показывает ожидаемый результат и не содержит сообщения об ошибке.",
      caution: "Это действие может затронуть других людей, деньги, права доступа или опубликованные данные. Всё внимательно проверьте.",
    }),
    verify: {
      title: "Проверить результат",
      instruction: "Найдите на странице обновлённое значение, сообщение о подтверждении или другой видимый признак выполнения цели.",
      verification: "Ожидаемый результат виден, и на странице нет нерешённых ошибок.",
      caution: "Не считайте изменение успешным без видимого подтверждения.",
    },
  },
  "pt-BR": {
    summary: (goal) => `Guia básico criado para seu objetivo: ${goal}`,
    input: (label) => ({
      title: `Atualizar ${label}`,
      instruction: `Encontre o campo “${label}” e digite o valor necessário para seu objetivo. Não insira senhas, códigos de segurança nem outros dados secretos.`,
      verification: `Confirme que o campo “${label}” mostra o valor desejado.`,
    }),
    select: (label) => ({
      title: `Escolher ${label}`,
      instruction: `Abra “${label}” e escolha a opção que corresponde ao seu objetivo.`,
      verification: `Confirme que “${label}” mostra a opção desejada.`,
    }),
    navigate: (label) => ({
      title: `Abrir ${label}`,
      instruction: `Selecione “${label}” para abrir a área correspondente e revise o que aparece antes de continuar.`,
      verification: `Confirme que a página agora mostra a seção associada a “${label}”.`,
    }),
    use: (label) => ({
      title: `Usar ${label}`,
      instruction: `Selecione “${label}” e revise a mudança visível na página antes de prosseguir.`,
      verification: `Confirme que selecionar “${label}” produziu o resultado visível esperado.`,
    }),
    review: {
      title: "Revisar a página atual",
      instruction: "Confirme que você está na página correta e compare as configurações visíveis com seu objetivo antes de alterar qualquer coisa.",
      verification: "A página e a conta correspondem à tarefa que você pretende concluir.",
      caution: "Pare se a página, a conta ou o resultado solicitado não forem os esperados.",
    },
    commit: (label) => ({
      title: `Confirmar com ${label}`,
      instruction: `Revise as alterações e selecione “${label}” quando estiver pronto para concluir.`,
      verification: "Confirme que a página mostra o resultado esperado e nenhuma mensagem de erro.",
      caution: "Revise os valores finais antes de continuar.",
    }),
    riskyCommit: (label) => ({
      title: "Revisar antes de confirmar",
      instruction: `Revise todos os valores e consequências. Selecione “${label}” somente quando tiver certeza.`,
      verification: "Confirme que a página mostra o resultado esperado e nenhuma mensagem de erro.",
      caution: "Esta ação pode afetar outras pessoas, dinheiro, acesso ou dados publicados. Revise tudo com atenção.",
    }),
    verify: {
      title: "Verificar o resultado",
      instruction: "Procure na página o valor atualizado, uma mensagem de confirmação ou outro sinal visível de que seu objetivo foi concluído.",
      verification: "O resultado desejado está visível e a página não mostra erros pendentes.",
      caution: "Não presuma que a alteração funcionou sem uma confirmação visível.",
    },
  },
};

function bounded(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalized(value) {
  return bounded(value, 500).normalize("NFKC").toLocaleLowerCase();
}

function tokens(value) {
  return new Set(
    (normalized(value).match(/[\p{L}\p{N}]+/gu) || [])
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

function matchesAny(value, terms) {
  const candidate = normalized(value);
  return terms.some((term) => {
    if (!candidate.includes(term)) return false;
    if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(term)) {
      return true;
    }

    let index = candidate.indexOf(term);
    while (index >= 0) {
      const before = candidate[index - 1] || "";
      const after = candidate[index + term.length] || "";
      const isWord = (character) => /[\p{L}\p{N}]/u.test(character);
      if (!isWord(before) && !isWord(after)) return true;
      index = candidate.indexOf(term, index + 1);
    }
    return false;
  });
}

function relevance(element, goalTokens, goal) {
  const label = bounded(element.label, 160);
  const labelNormalized = normalized(label);
  const labelTokens = tokens(label);
  let score = 0;

  for (const token of labelTokens) {
    if (goalTokens.has(token)) score += token.length > 4 ? 5 : 3;
  }
  if (labelNormalized.length >= 2 && goal.includes(labelNormalized)) score += 8;
  if (score > 0 && ["input", "select", "tab"].includes(element.role)) score += 1;
  return score;
}

function targetStep(element, copy) {
  const label = bounded(element.label, 160);
  const common = {
    targetText: label,
    targetRole: element.role,
    caution: "",
  };

  let localized;
  if (element.role === "input") localized = copy.input(label);
  else if (element.role === "select") localized = copy.select(label);
  else if (["link", "tab", "menuitem"].includes(element.role)) localized = copy.navigate(label);
  else localized = copy.use(label);

  return {
    ...common,
    title: bounded(localized.title, 90),
    instruction: bounded(localized.instruction, 360),
    verification: bounded(localized.verification, 240),
  };
}

function reviewStep(copy) {
  return {
    ...copy.review,
    targetText: "",
    targetRole: "other",
  };
}

function commitStep(element, copy) {
  const label = bounded(element.label, 160);
  const localized = matchesAny(label, HIGH_RISK_TERMS)
    ? copy.riskyCommit(label)
    : copy.commit(label);

  return {
    title: bounded(localized.title, 90),
    instruction: bounded(localized.instruction, 360),
    targetText: label,
    targetRole: element.role,
    verification: bounded(localized.verification, 240),
    caution: bounded(localized.caution, 220),
  };
}

function verifyStep(copy) {
  return {
    ...copy.verify,
    targetText: "",
    targetRole: "other",
  };
}

export function createFallbackMissionPlan(input) {
  const language = resolveLanguage(input.language);
  const copy = COPY[language];
  const goal = bounded(input.goal, 400);
  const goalNormalized = normalized(goal);
  const goalTokens = tokens(goal);
  const elements = (input.interactiveElements || [])
    .map((element) => ({
      role: element.role,
      label: bounded(element.label, 160),
    }))
    .filter((element) => element.label && !matchesAny(element.label, SENSITIVE_TERMS));

  const ranked = elements
    .map((element, index) => ({
      element,
      index,
      score: relevance(element, goalTokens, goalNormalized),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);

  const targets = ranked
    .filter(({ element }) => !matchesAny(element.label, COMMIT_TERMS))
    .filter(({ score }) => score > 0)
    .slice(0, 2)
    .map(({ element }) => element);

  const commitCandidate = ranked
    .filter(({ element }) => matchesAny(element.label, COMMIT_TERMS))
    .sort((left, right) => right.score - left.score || right.index - left.index)[0];
  const commit = commitCandidate && (
    commitCandidate.score > 0 ||
    (targets.length > 0 && matchesAny(commitCandidate.element.label, SAFE_COMMIT_TERMS))
  )
    ? commitCandidate.element
    : null;

  const steps = targets.length
    ? targets.map((target) => targetStep(target, copy))
    : [reviewStep(copy)];

  steps.push(commit ? commitStep(commit, copy) : verifyStep(copy));

  return {
    summary: bounded(copy.summary(goal), 280),
    steps: steps.slice(0, 4),
  };
}

export function shouldUseFallback(error) {
  return Boolean(error);
}
