// Point d'entrée : les notifications sont mises en place avant le routeur, pour que les boutons
// des rappels soient traités même quand l'application est lancée en arrière-plan.
import './src/notifications-setup';
import 'expo-router/entry';
