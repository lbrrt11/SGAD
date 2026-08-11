document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('sgad_token');
    const usuarioString = localStorage.getItem('sgad_usuario');

    if (!token || !usuarioString) {
        window.location.href = 'index.html';
        return;
    }

    const usuarioLogado = JSON.parse(usuarioString);
    document.getElementById('mensagemBoasVindas').textContent = `Olá, ${usuarioLogado.login} (${usuarioLogado.perfil})`;

    document.getElementById('btnSair').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    const isAdmin = usuarioLogado.perfil === 'Admin';
    
    if (isAdmin) {
        document.getElementById('btnNovoFuncionario').style.display = 'block';
        document.getElementById('colunaAcoes').style.display = 'table-cell';
    }

    // --- LÓGICA DE CARREGAR A LISTA ---
    async function carregarFuncionarios() {
        try {
            const response = await fetch('http://localhost:3000/api/funcionarios', {
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const funcionarios = await response.json();
            
            const corpoTabela = document.getElementById('corpoTabela');
            corpoTabela.innerHTML = ''; 

            funcionarios.forEach(func => {
                const tr = document.createElement('tr');
                
                let acoesHtml = '';
                if (isAdmin) {
                    if (func.login === usuarioLogado.login) {
                        acoesHtml = `<td style="color: gray; font-size: 12px; font-weight: bold;">Sua conta</td>`;
                    } else if (func.id === 1) { 
                        acoesHtml = `<td><span style="background: #ffd70040; color: #b8860b; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">👑 Admin Master</span></td>`;
                    } else {
                        acoesHtml = `<td><button class="btn-excluir" onclick="deletarFuncionario(${func.id}, '${func.login}')">Excluir</button></td>`;
                    }
                }

                // Tabela atualizada com a coluna do Nome Completo
                tr.innerHTML = `
                    <td><strong>#${func.id}</strong></td>
                    <td>${func.login}</td>
                    <td>${func.nome_completo || '-'}</td>
                    <td>${func.perfil}</td>
                    ${isAdmin ? acoesHtml : ''}
                `;
                corpoTabela.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            document.getElementById('corpoTabela').innerHTML = '<tr><td colspan="5">Erro ao buscar banco de dados.</td></tr>';
        }
    }

    carregarFuncionarios();

    // --- LÓGICA DO MODAL (ADICIONAR FUNCIONÁRIO) ---
    const modal = document.getElementById('modalNovoFuncionario');
    
    document.getElementById('btnNovoFuncionario').addEventListener('click', () => {
        modal.style.display = 'flex';
        document.getElementById('erroModal').textContent = '';
    });

    document.getElementById('btnCancelarModal').addEventListener('click', () => {
        modal.style.display = 'none';
        document.getElementById('novoLogin').value = '';
        document.getElementById('novoNomeCompleto').value = ''; // Limpa o novo campo
        document.getElementById('novoPerfil').value = 'Funcionario'; 
        document.getElementById('novaSenha').value = '';
        document.getElementById('confirmaSenha').value = '';
    });

    document.getElementById('btnSalvarFuncionario').addEventListener('click', async () => {
        const login = document.getElementById('novoLogin').value.trim();
        const nome_completo = document.getElementById('novoNomeCompleto').value.trim(); // Pega o valor
        const perfil = document.getElementById('novoPerfil').value; 
        const senha = document.getElementById('novaSenha').value;
        const confirmaSenha = document.getElementById('confirmaSenha').value;
        const erroMsg = document.getElementById('erroModal');

        if (!login || !nome_completo || !senha || !confirmaSenha) {
            erroMsg.textContent = "Preencha todos os campos!";
            return;
        }

        if (senha !== confirmaSenha) {
            erroMsg.textContent = "As senhas não coincidem!";
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/funcionarios/cadastrar', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ login, nome_completo, senha, perfil }) // Envia o nome_completo
            });

            const data = await response.json();

            if (response.ok) {
                alert("Funcionário criado com sucesso!");
                document.getElementById('btnCancelarModal').click(); 
                carregarFuncionarios(); 
            } else {
                erroMsg.textContent = data.message || "Erro ao cadastrar.";
            }
        } catch (error) {
            erroMsg.textContent = "Erro de conexão com a API.";
        }
    });

    // --- LÓGICA DE EXCLUSÃO ---
    window.deletarFuncionario = async (id, login) => {
        if (confirm(`Tem certeza que deseja excluir o funcionário ${login} (ID: ${id})?`)) {
            try {
                const response = await fetch(`http://localhost:3000/api/funcionarios/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    carregarFuncionarios(); 
                } else {
                    alert("Erro ao excluir funcionário.");
                }
            } catch (error) {
                alert("Erro de conexão com o servidor.");
            }
        }
    };
});