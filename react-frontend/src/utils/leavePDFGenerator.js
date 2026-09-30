import jsPDF from 'jspdf';

export const generateLeavePDF = (leaveRequest, employeeInfo) => {
  const doc = new jsPDF();
  
  // Palette de Couleurs Keystone Premium
  const primaryNavy = [0, 51, 102];      // #003366
  const secondaryDark = [17, 28, 45];    // #111C2D
  const textDark = [30, 41, 59];         // #1E293B
  const textMuted = [100, 116, 139];     // #64748B
  const borderGray = [226, 232, 240];    // #E2E8F0
  const bgLight = [248, 250, 252];       // #F8FAFC

  const formatDate = (d) => {
    if (!d) return '-';
    const dateObj = new Date(d);
    return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 1;
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // 1. EN-TÊTE DE L'ENTREPRISE (BANNER)
  // Barre supérieure bleue
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, 210, 38, 'F');
  
  // Logo Keystone (Badge K)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(16, 8, 22, 22, 4, 4, 'F');
  doc.setTextColor(...primaryNavy);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('K', 27, 24, { align: 'center' });

  // Nom & Infos Entreprise
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('KEYSTONE ENTERPRISE', 44, 18);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Direction des Ressources Humaines • Service Gestion des Congés', 44, 25);
  doc.text('contact@keystone-group.com  |  www.keystone.com  |  +33 (0)1 42 68 00 00', 44, 31);

  // 2. RÉFÉRENCE & DATE D'ÉMISSION
  let y = 48;
  const refNum = `KEY-CONGE-${leaveRequest.id ? String(leaveRequest.id).padStart(4, '0') : String(Math.floor(1000 + Math.random() * 9000))}`;
  const rawCreationDate = leaveRequest.created_at || leaveRequest.createdAt || leaveRequest.startDate || new Date();
  
  doc.setTextColor(...textMuted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`RÉFÉRENCE DOCUMENT : ${refNum}`, 16, y);
  doc.text(`DATE D'ÉMISSION : ${formatDate(rawCreationDate)}`, 194, y, { align: 'right' });

  // Ligne de séparation
  y += 4;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.5);
  doc.line(16, y, 194, y);

  // 3. TITRE PRINCIPAL & BADGE DE STATUT
  y += 14;
  doc.setTextColor(...secondaryDark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ATTESTATION DE DEMANDE DE CONGÉ', 16, y);

  // Badge de statut (Coloré selon le statut)
  const status = (leaveRequest.status || 'en_attente').toLowerCase();
  let statusText = 'EN ATTENTE';
  let badgeBg = [254, 243, 199];     // Jaune #FEF3C7
  let badgeTxt = [180, 83, 9];       // Jaune foncé #B45309

  if (status === 'accepte' || status === 'approuve') {
    statusText = 'APPROUVÉ';
    badgeBg = [209, 250, 229];       // Vert #D1FAE5
    badgeTxt = [4, 120, 87];         // Vert foncé #047857
  } else if (status === 'refuse') {
    statusText = 'REFUSÉ';
    badgeBg = [254, 226, 226];       // Rouge #FEE2E2
    badgeTxt = [185, 28, 28];        // Rouge foncé #B91C1C
  }

  doc.setFillColor(...badgeBg);
  doc.roundedRect(150, y - 8, 44, 10, 3, 3, 'F');
  doc.setTextColor(...badgeTxt);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, 172, y - 1.5, { align: 'center' });

  // 4. SECTION 1 : INFORMATIONS DE L'EMPLOYÉ
  y += 14;
  doc.setFillColor(...bgLight);
  doc.roundedRect(16, y, 178, 38, 4, 4, 'F');
  doc.setDrawColor(...borderGray);
  doc.roundedRect(16, y, 178, 38, 4, 4, 'S');

  doc.setTextColor(...primaryNavy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Informations du Demandeur', 22, y + 9);

  const fullName = `${employeeInfo.firstName || ''} ${employeeInfo.lastName || ''}`.trim() || 'Collaborateur';
  const username = employeeInfo.username || '-';

  doc.setTextColor(...textDark);
  doc.setFontSize(9.5);
  
  // Colonne 1
  doc.setFont('helvetica', 'bold');
  doc.text('Nom & Prénom :', 22, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(fullName, 58, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Identifiant / Sub :', 22, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(username, 58, y + 29);

  // Colonne 2
  doc.setFont('helvetica', 'bold');
  doc.text('Entreprise :', 115, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('Keystone Group', 145, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Département :', 115, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text('Ressources Humaines', 145, y + 29);

  // 5. SECTION 2 : DÉTAILS DE LA DEMANDE DE CONGÉ
  y += 48;
  doc.setFillColor(...bgLight);
  doc.roundedRect(16, y, 178, 65, 4, 4, 'F');
  doc.setDrawColor(...borderGray);
  doc.roundedRect(16, y, 178, 65, 4, 4, 'S');

  doc.setTextColor(...primaryNavy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Détails de la Demande de Congé', 22, y + 9);

  const totalDays = calculateDays(leaveRequest.startDate, leaveRequest.endDate);
  const typeLabel = (leaveRequest.type || 'Annuel').toUpperCase();

  doc.setTextColor(...textDark);
  doc.setFontSize(9.5);

  // Ligne 1: Type & Durée
  doc.setFont('helvetica', 'bold');
  doc.text('Type de congé :', 22, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(typeLabel, 58, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Durée totale :', 115, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalDays} jour(s) calendaire(s)`, 145, y + 20);

  // Ligne 2: Dates de début et fin
  doc.setFont('helvetica', 'bold');
  doc.text('Date de début :', 22, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(leaveRequest.startDate), 58, y + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Date de fin :', 115, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(leaveRequest.endDate), 145, y + 30);

  // Ligne 3: Motif
  doc.setFont('helvetica', 'bold');
  doc.text('Motif indiqué :', 22, y + 42);
  doc.setFont('helvetica', 'normal');
  const reasonText = leaveRequest.reason || 'Aucun motif renseigné';
  const splitReason = doc.splitTextToSize(reasonText, 130);
  doc.text(splitReason, 58, y + 42);

  // 6. CADRES DE SIGNATURE & TAMPON
  y += 76;
  doc.setTextColor(...primaryNavy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Approbation & Signatures', 16, y);

  y += 6;
  // Boîte 1: Signature Employé
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(16, y, 84, 42, 3, 3, 'FD');
  doc.setTextColor(...textMuted);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text("Signature du Demandeur :", 20, y + 7);
  doc.setFont('helvetica', 'italic');
  doc.text(`Mentions: "Lu et approuvé"`, 20, y + 13);
  
  doc.setTextColor(...textDark);
  doc.setFontSize(9);
  doc.text(fullName, 20, y + 34);

  // Boîte 2: Signature & Tampon Direction RH
  doc.roundedRect(110, y, 84, 42, 3, 3, 'FD');
  doc.setTextColor(...textMuted);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text("Cachet et Signature RH / Manager :", 114, y + 7);

  // Faux tampon RH Keystone
  doc.setDrawColor(...primaryNavy);
  doc.setLineWidth(0.8);
  doc.roundedRect(138, y + 12, 50, 24, 2, 2, 'S');
  doc.setTextColor(...primaryNavy);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text("KEYSTONE GROUP", 163, y + 19, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text("DIRECTION DES RESSOURCES HUMAINES", 163, y + 24, { align: 'center' });
  doc.setFontSize(7);
  doc.text("★ VALIDÉ ELECTRONIQUEMENT ★", 163, y + 30, { align: 'center' });

  // 7. PIED DE PAGE & NOTE LÉGALE
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 280, 210, 17, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Keystone Enterprise S.A.S - 12 Avenue des Champs-Élysées, 75008 Paris - SIRET 891 234 567 00012', 105, 287, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(200, 215, 235);
  doc.text('Ce document est édité automatiquement via le Portail RH Keystone et fait foi de récépissé officiel de la demande.', 105, 292, { align: 'center' });

  // Sauvegarde du fichier PDF
  const safeDateStr = leaveRequest.startDate && !isNaN(new Date(leaveRequest.startDate).getTime())
    ? new Date(leaveRequest.startDate).toISOString().split('T')[0]
    : 'demande';
  const fileName = `demande_conge_KEYSTONE_${employeeInfo.username || 'user'}_${safeDateStr}.pdf`;
  doc.save(fileName);
};
