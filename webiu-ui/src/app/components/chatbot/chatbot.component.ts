import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { ThemeService } from '../../services/theme.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface ChatMessage {
  text: string | SafeHtml;
  sender: 'user' | 'bot';
  loading?: boolean;
  timestamp?: Date;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isChatOpen: boolean = false;
  private shouldScroll: boolean = false;

  constructor(
    private geminiService: GeminiService,
    private sanitizer: DomSanitizer,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.loadChatHistory();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private loadChatHistory() {
    try {
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        this.messages = parsedMessages.map((msg: ChatMessage) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
          text: this.processLinks(msg.text.toString()),
        }));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  private processLinks(text: string): SafeHtml {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const processedText = text.replace(
      urlRegex,
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
    return this.sanitizer.bypassSecurityTrustHtml(processedText);
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.shouldScroll = true;
    }
  }

  clearChat(): void {
    this.messages = [];
    this.geminiService.clearHistory();
    localStorage.removeItem('chatHistory');
  }

  private scrollToBottom(): void {
    try {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  sendMessage(): void {
    const trimmedInput = this.userInput.trim();
    if (trimmedInput === '' || this.isLoading) return;

    const userMessage: ChatMessage = {
      text: trimmedInput,
      sender: 'user',
      timestamp: new Date(),
    };

    this.messages.push(userMessage);
    this.saveToLocalStorage();
    this.shouldScroll = true;

    const loadingMessage: ChatMessage = {
      text: 'Ai-Assistant',
      sender: 'bot',
      loading: true,
    };

    this.messages.push(loadingMessage);
    this.isLoading = true;
    this.userInput = '';

    this.geminiService.generateResponse(trimmedInput).subscribe({
      next: (response) => {
        this.messages.pop();

        const botMessage: ChatMessage = {
          text: this.processLinks(response.candidates[0].content.parts[0].text),
          sender: 'bot',
          timestamp: new Date(),
        };

        this.messages.push(botMessage);
        this.saveToLocalStorage();
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: (error: Error) => {
        this.messages.pop();

        const errorMessage: ChatMessage = {
          text: error.message,
          sender: 'bot',
          timestamp: new Date(),
        };

        this.messages.push(errorMessage);
        this.saveToLocalStorage();
        this.isLoading = false;
        this.shouldScroll = true;
        console.error('Gemini API Error:', error);
      },
    });
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(this.messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }
}
